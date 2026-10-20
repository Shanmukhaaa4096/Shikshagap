import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRICULUM_REGISTRY,
  ancestorsOfConcept,
} from "../src/data/curriculum/index.ts";

test("Curriculum Cross-Grade Backtracking: Class 10 Quadratic Equations reaches lower classes", () => {
  // CBSE Class 10 Quadratic Equations (cbse_10_quadratic_equations)
  const quadConcept = CURRICULUM_REGISTRY["cbse_10_quadratic_equations"];
  assert.ok(quadConcept, "cbse_10_quadratic_equations should exist in curriculum registry");

  const ancestors = ancestorsOfConcept("cbse_10_quadratic_equations");
  assert.ok(ancestors.size > 0, "Ancestors should not be empty");

  // Should reach Class 9 Polynomials
  assert.ok(
    ancestors.has("cbse_9_polynomials"),
    "Class 10 Quadratic Equations must backtrack to Class 9 Polynomials (cbse_9_polynomials)"
  );

  // Class 9 Polynomials reaches Class 8 Factorisation or identities
  assert.ok(
    ancestors.has("cbse_8_factorisation") || ancestors.has("cbse_8_algebraic_expressions"),
    "Must reach Class 8 Factorisation or Algebraic Expressions"
  );

  // Class 8 reaches Class 7 Algebraic Expressions
  assert.ok(
    ancestors.has("cbse_7_algebraic_expressions") || ancestors.has("cbse_7_simple_equations"),
    "Must reach Class 7 Algebraic Expressions or Equations"
  );

  // Class 7 reaches Class 6 Algebra Basics
  assert.ok(
    ancestors.has("cbse_6_algebra_basics"),
    "Must reach Class 6 Algebra Basics (cbse_6_algebra_basics)"
  );
});

test("Curriculum Cross-Grade Backtracking: Class 10 Trigonometry reaches Class 7 & 9 Geometry", () => {
  // CBSE Class 10 Intro to Trigonometry (cbse_10_trigonometry)
  const trigAncestors = ancestorsOfConcept("cbse_10_trigonometry");
  assert.ok(
    trigAncestors.has("cbse_10_triangles_similarity"),
    "Trigonometry must backtrack to Class 10 Similar Triangles"
  );
  assert.ok(
    trigAncestors.has("cbse_9_triangles_congruence"),
    "Similar Triangles must backtrack to Class 9 Triangles Congruence"
  );
  assert.ok(
    trigAncestors.has("cbse_7_triangles"),
    "Class 9 Triangles must backtrack to Class 7 Triangles"
  );
});

test("Curriculum Cross-Grade Backtracking: ICSE Class 10 Commercial Math reaches Class 9 & 8", () => {
  // ICSE Class 10 Commercial Math (icse_10_commercial_math)
  const gstAncestors = ancestorsOfConcept("icse_10_commercial_math");
  assert.ok(
    gstAncestors.has("icse_9_commercial_math"),
    "ICSE Class 10 GST must backtrack to Class 9 Commercial Math"
  );
  assert.ok(
    gstAncestors.has("icse_8_commercial_math"),
    "ICSE Class 9 Commercial Math must backtrack to Class 8 Commercial Math"
  );
});
