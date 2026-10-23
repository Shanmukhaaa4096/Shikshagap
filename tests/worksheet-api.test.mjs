import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/worksheet/route.ts";
import { getQuestionStore } from "../src/lib/db/questionStore.ts";

function createMockRequest(url, options = {}) {
  const req = new Request(url, options);
  req.nextUrl = new URL(url);
  return req;
}

test("Worksheet API: POST /api/worksheet retrieves from question_memory, runs code validation, and builds structured worksheet", async () => {
  const store = getQuestionStore();
  await store.clear();

  // 1. Initial request: generates new items and saves them to question_memory
  const req1 = createMockRequest("http://localhost:3000/api/worksheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classNum: 8,
      board: "CBSE",
      count: 10,
      language: "en",
      seed: 80808,
    }),
  });

  const res1 = await POST(req1);
  assert.equal(res1.status, 200, "API must return status 200");
  const data1 = await res1.json();

  assert.ok(data1.success, "Response must indicate success");
  assert.ok(data1.worksheet, "Response must contain worksheet");
  assert.equal(data1.worksheet.items.length, 10, "Worksheet must have 10 items");
  assert.ok(data1.newlySavedCount > 0, "Newly generated validated items must be saved to question_memory");

  // Invariant: Header skillsLine is dynamically derived from item topics, never a default string
  assert.ok(data1.worksheet.header.skillsLine.startsWith("Skills: "), "Header skillsLine must start with 'Skills: '");
  for (const item of data1.worksheet.items) {
    assert.ok(
      data1.worksheet.header.skillsLine.includes(item.topic),
      `Header skillsLine must include item topic '${item.topic}'`
    );
  }

  // Invariant: Answer key generated from same items
  assert.equal(data1.worksheet.answerKey.length, 10, "Answer key must contain 10 entries");
  for (let i = 0; i < 10; i++) {
    assert.equal(data1.worksheet.answerKey[i].number, data1.worksheet.items[i].number);
    assert.equal(data1.worksheet.answerKey[i].correctAnswer, data1.worksheet.items[i].correctAnswer);
  }

  // 2. Second request: should retrieve stored questions from question_memory
  const req2 = createMockRequest("http://localhost:3000/api/worksheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classNum: 8,
      board: "CBSE",
      count: 10,
      language: "en",
      seed: 80809,
    }),
  });

  const res2 = await POST(req2);
  assert.equal(res2.status, 200);
  const data2 = await res2.json();

  assert.ok(data2.success);
  assert.ok(
    data2.retrievedFromStoreCount > 0,
    `Must retrieve stored questions from question_memory (found ${data2.retrievedFromStoreCount})`
  );

  // 3. Strict board filtering: ICSE requested returns zero CBSE items
  const reqIcse = createMockRequest("http://localhost:3000/api/worksheet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      classNum: 8,
      board: "ICSE",
      count: 10,
      language: "en",
      seed: 90909,
    }),
  });

  const resIcse = await POST(reqIcse);
  const dataIcse = await resIcse.json();
  assert.equal(resIcse.status, 200);

  for (const item of dataIcse.worksheet.items) {
    assert.notEqual(item.board, "CBSE", `ICSE worksheet item #${item.number} must not be CBSE`);
  }
});
