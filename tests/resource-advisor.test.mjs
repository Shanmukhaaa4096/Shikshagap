import test from "node:test";
import assert from "node:assert/strict";
import {
  filterCandidates,
  cosineSimilarity,
  computeDeterministicQueryEmbedding,
  rankCandidates,
  recommendResources,
} from "../src/lib/agents/resourceAdvisor.ts";
import resourcesData from "../src/data/resources.json" with { type: "json" };
import embeddingsData from "../src/data/resources.embeddings.json" with { type: "json" };

test("Resource Advisor: Filters properly by grade and language", () => {
  // English Grade 4
  const enG4 = filterCandidates(resourcesData, "number_ops", 4, "en");
  assert.ok(enG4.length > 0, "Should find English Grade 4 resources");
  for (const r of enG4) {
    assert.equal(r.topicId, "number_ops");
    assert.ok(r.grade.includes(4), "Resource must support grade 4");
    assert.equal(r.language, "en");
  }

  // Hindi Grade 4
  const hiG4 = filterCandidates(resourcesData, "number_ops", 4, "hi");
  assert.ok(hiG4.length > 0, "Should find Hindi Grade 4 resources");
  for (const r of hiG4) {
    assert.equal(r.topicId, "number_ops");
    assert.ok(r.grade.includes(4));
    assert.equal(r.language, "hi");
  }

  // Telugu Grade 4
  const teG4 = filterCandidates(resourcesData, "number_ops", 4, "te");
  assert.ok(teG4.length > 0, "Should find Telugu Grade 4 resources");
  for (const r of teG4) {
    assert.equal(r.topicId, "number_ops");
  }
});

test("Resource Advisor: Fallback works when no Gemini key is provided", async () => {
  const memory = {
    pseudonymousId: "anon_test_123",
    language: "en",
    grade: 4,
    currentTopicIndex: 0,
    topics: [
      {
        topicId: "multiplication",
        status: "gap",
        attempts: [],
        notes: [],
        misconceptions: ["table_recall_delay", "partial_product_alignment"],
      },
      {
        topicId: "number_ops",
        status: "mastered", // Mastered topics should NOT receive recommendations
        attempts: [],
        notes: [],
      },
    ],
  };

  // Explicitly call without Gemini client
  const recs = await recommendResources(memory, { client: null });
  assert.equal(recs.length, 1, "Only the gap topic should have recommendations");
  assert.equal(recs[0].topicId, "multiplication");
  assert.ok(recs[0].resources.length > 0 && recs[0].resources.length <= 3, "Up to 3 resources returned");

  for (const r of recs[0].resources) {
    assert.ok(r.id.startsWith("res_mul_"), "Returned item belongs to multiplication");
    assert.ok(r.title);
    assert.ok(r.url);
    assert.ok(r.reason, "Fallback must supply a reason");
  }
});

test("Resource Advisor: Dropping IDs not in candidate set and keeping valid ones", async () => {
  const memory = {
    pseudonymousId: "anon_test_456",
    language: "en",
    grade: 5,
    currentTopicIndex: 0,
    topics: [
      {
        topicId: "fractions",
        status: "developing",
        attempts: [],
        notes: [],
        misconceptions: ["confuses_numerator_denominator"],
      },
    ],
  };

  // Mock Gemini client that hallucinates fake IDs or IDs from a different topic
  const mockClient = {
    models: {
      generateContent: async () => {
        return {
          text: JSON.stringify({
            recommendations: [
              { id: "hallucinated_fake_id_999", reason: "Fake resource" },
              { id: "res_frac_02", reason: "Clear visual explanation of equivalent fractions." },
              { id: "res_num_01", reason: "Wrong topic resource (number_ops instead of fractions)" },
            ],
          }),
        };
      },
    },
  };

  const recs = await recommendResources(memory, { client: mockClient });
  assert.equal(recs.length, 1);
  assert.equal(recs[0].topicId, "fractions");

  // "hallucinated_fake_id_999" and "res_num_01" must have been dropped
  const ids = recs[0].resources.map((r) => r.id);
  assert.ok(ids.includes("res_frac_02"), "Valid candidate res_frac_02 must be included");
  assert.ok(!ids.includes("hallucinated_fake_id_999"), "Hallucinated ID must be dropped");
  assert.ok(!ids.includes("res_num_01"), "Wrong topic candidate must be dropped");
  assert.equal(ids.length, 1);
  assert.equal(recs[0].resources[0].reason, "Clear visual explanation of equivalent fractions.");
});

test("Resource Advisor: Falls back to top-3 if Gemini returns ONLY invalid IDs", async () => {
  const memory = {
    pseudonymousId: "anon_test_789",
    language: "en",
    grade: 5,
    currentTopicIndex: 0,
    topics: [
      {
        topicId: "division",
        status: "gap",
        attempts: [],
        notes: [],
        misconceptions: ["remainder_greater_than_divisor"],
      },
    ],
  };

  // Mock Gemini returning only bogus IDs
  const mockClient = {
    models: {
      generateContent: async () => {
        return {
          text: JSON.stringify({
            recommendations: [
              { id: "bogus_1", reason: "None" },
              { id: "bogus_2", reason: "None" },
            ],
          }),
        };
      },
    },
  };

  const recs = await recommendResources(memory, { client: mockClient });
  assert.equal(recs.length, 1);
  assert.equal(recs[0].topicId, "division");
  // Should fallback to top 3 valid division candidates
  assert.ok(recs[0].resources.length > 0 && recs[0].resources.length <= 3);
  for (const r of recs[0].resources) {
    assert.ok(r.id.startsWith("res_div_"));
  }
});
