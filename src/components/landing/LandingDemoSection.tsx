'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from '@phosphor-icons/react';
import { ClassSelector } from '@/components/ClassSelector';
import { getClassConfig, DEFAULT_CLASS_ID } from '@/lib/curriculum/classes';

export const MULTICLASS_DEMO_DATA: Record<string, Array<{
  id: string;
  name: string;
  rollNo: number;
  gradeLabel: string;
  topic: string;
  status: string;
  statusType: 'critical' | 'warn' | 'good';
  mastery: number;
  question: string;
  options: string[];
  correctOption: string;
  studentChoice: string;
  observedMistake: string;
  rootGap: string;
  prerequisiteFor: string;
  evidence: string;
  plan: Array<{ day: string; task: string }>;
  reassessmentResult: string;
}>> = {
  class_3: [
    {
      id: 'demo-c3-1',
      name: 'Anil Kumar',
      rollNo: 4,
      gradeLabel: 'Class 3A',
      topic: '2-Digit Subtraction with Regrouping',
      status: 'Needs Immediate Help',
      statusType: 'critical',
      mastery: 38,
      question: 'Solve: 52 - 27 = ?',
      options: ['35', '25', '30', '21'],
      correctOption: '25',
      studentChoice: '35',
      observedMistake: 'Subtracted smaller digit from larger digit (7 - 2 = 5) instead of borrowing from tens',
      rootGap: 'Place Value and Regrouping (Tens to Units)',
      prerequisiteFor: '2-Digit Subtraction with Regrouping',
      evidence: 'Student wrote 52 - 27 = 35 by reversing the ones place subtraction.',
      plan: [
        { day: 'Day 1', task: 'Use bundles of 10 matchsticks and loose sticks to model 52.' },
        { day: 'Day 2', task: 'Untie one ten-bundle into 10 loose sticks to show borrowing clearly.' },
        { day: 'Day 3', task: 'Practice subtracting loose sticks after regrouping.' },
        { day: 'Day 4', task: 'Write place value columns on slate and solve 3 regrouping sums.' },
        { day: 'Day 5', task: 'Check understanding with 2 new subtraction problems.' }
      ],
      reassessmentResult: 'Student solved 52 - 27 and 61 - 38 correctly with physical bundles and column notation.'
    },
    {
      id: 'demo-c3-2',
      name: 'Meena Bai',
      rollNo: 11,
      gradeLabel: 'Class 3A',
      topic: 'Repeated Addition (Multiplication Concept)',
      status: 'Needs Practice',
      statusType: 'warn',
      mastery: 58,
      question: 'There are 4 plates. Each plate has 3 bananas. How many bananas in all?',
      options: ['7 bananas', '12 bananas', '10 bananas', '15 bananas'],
      correctOption: '12 bananas',
      studentChoice: '7 bananas',
      observedMistake: 'Added the numbers 4 + 3 instead of counting 4 equal groups of 3',
      rootGap: 'Equal Groups Concept',
      prerequisiteFor: 'Multiplication Facts',
      evidence: 'Student added 4 and 3 directly without visualizing 4 separate plates of 3.',
      plan: [
        { day: 'Day 1', task: 'Arrange pebbles in 4 circles with 3 pebbles in each circle.' },
        { day: 'Day 2', task: 'Skip count aloud by threes: 3, 6, 9, 12.' },
        { day: 'Day 3', task: 'Write repeated addition: 3 + 3 + 3 + 3 = 12.' },
        { day: 'Day 4', task: 'Connect to multiplication sentence: 4 times 3 equals 12.' },
        { day: 'Day 5', task: 'Complete 4 grouping drawing problems.' }
      ],
      reassessmentResult: 'Student recognized that 5 groups of 2 equals 10, not 7.'
    }
  ],
  class_4: [
    {
      id: 'demo-c4-1',
      name: 'Pooja Reddy',
      rollNo: 9,
      gradeLabel: 'Class 4A',
      topic: 'Sharing Division Concept',
      status: 'Needs Immediate Help',
      statusType: 'critical',
      mastery: 42,
      question: 'Share 20 marbles equally among 4 friends. How many marbles does each friend get?',
      options: ['16 marbles', '5 marbles', '6 marbles', '4 marbles'],
      correctOption: '5 marbles',
      studentChoice: '16 marbles',
      observedMistake: 'Subtracted 4 from 20 once instead of sharing equally into 4 equal shares',
      rootGap: 'Equal Sharing Partitioning',
      prerequisiteFor: 'Division Facts and Long Division',
      evidence: 'Student calculated 20 - 4 = 16 and stopped.',
      plan: [
        { day: 'Day 1', task: 'Distribute 20 bottle caps one by one into 4 bowls.' },
        { day: 'Day 2', task: 'Draw 4 circles and share 12 dots equally to confirm the idea.' },
        { day: 'Day 3', task: 'Connect to the 4 times multiplication table: 4 x 5 = 20.' },
        { day: 'Day 4', task: 'Solve 3 simple sharing word problems on the board.' },
        { day: 'Day 5', task: 'Complete a 1-page paper worksheet with sharing problems.' }
      ],
      reassessmentResult: 'Student accurately shared 18 items into 3 bowls without subtracting.'
    },
    {
      id: 'demo-c4-2',
      name: 'Sunil Rao',
      rollNo: 15,
      gradeLabel: 'Class 4A',
      topic: 'Unit Fractions (Part of a Whole)',
      status: 'Needs Practice',
      statusType: 'warn',
      mastery: 62,
      question: 'Which is larger: 1/3 or 1/6 of the same chapati?',
      options: ['1/6 is larger', '1/3 is larger', 'Both are equal', 'Cannot tell'],
      correctOption: '1/3 is larger',
      studentChoice: '1/6 is larger',
      observedMistake: 'Believed 1/6 is larger because 6 is a bigger number than 3',
      rootGap: 'Denominator Size Meaning',
      prerequisiteFor: 'Comparing Fractions',
      evidence: 'Student treated denominator as a whole number without seeing slice size.',
      plan: [
        { day: 'Day 1', task: 'Fold two circular paper chapatis into 3 parts and 6 parts.' },
        { day: 'Day 2', task: 'Place one 1/3 slice over a 1/6 slice to see which piece is larger.' },
        { day: 'Day 3', task: 'Learn the rule: more slices mean smaller slices.' },
        { day: 'Day 4', task: 'Draw and color 1/2, 1/4, and 1/8 on strip drawings.' },
        { day: 'Day 5', task: 'Short 3-question paper check comparing unit fractions.' }
      ],
      reassessmentResult: 'Student proved on paper that 1/4 is bigger than 1/8.'
    }
  ],
  class_5: [
    {
      id: 'demo-c5-1',
      name: 'Rajesh Kumar',
      rollNo: 7,
      gradeLabel: 'Class 5A',
      topic: 'Long Division with Remainder',
      status: 'Needs Immediate Help',
      statusType: 'critical',
      mastery: 42,
      question: 'If 24 laddus are shared equally among 6 children, how many laddus does each child get?',
      options: ['3 laddus', '4 laddus', '5 laddus', '6 laddus'],
      correctOption: '4 laddus',
      studentChoice: '3 laddus',
      observedMistake: 'Subtracted 6 from 24 instead of dividing into equal groups',
      rootGap: 'Division Concept (Equal Sharing)',
      prerequisiteFor: 'Long Division with Remainder',
      evidence: 'Student attempted to subtract the divisor once instead of partitioning 24 into 6 equal shares.',
      plan: [
        { day: 'Day 1', task: 'Use 24 pebbles or bottle caps. Practice sharing them equally into 6 bowls.' },
        { day: 'Day 2', task: 'Draw circles on slate and distribute dots equally to build grouping sense.' },
        { day: 'Day 3', task: 'Relate division facts to the 6 times table (6 x 4 = 24, so 24 / 6 = 4).' },
        { day: 'Day 4', task: 'Solve 4 simple sharing word problems with drawings.' },
        { day: 'Day 5', task: 'Check understanding with 3 new sharing questions on paper.' }
      ],
      reassessmentResult: 'After Day 5 practice, student answered 3 of 3 sharing questions correctly. Ready for 2-digit division.'
    },
    {
      id: 'demo-c5-2',
      name: 'Priya Sharma',
      rollNo: 12,
      gradeLabel: 'Class 5A',
      topic: 'Fractions (Part of a Whole)',
      status: 'Needs Practice',
      statusType: 'warn',
      mastery: 60,
      question: 'Which fraction is greater: 1/4 or 1/8 of the same roti?',
      options: ['1/8 is greater', '1/4 is greater', 'Both are equal', 'Cannot tell'],
      correctOption: '1/4 is greater',
      studentChoice: '1/8 is greater',
      observedMistake: 'Treated denominator 8 as a larger quantity than 4 without considering slice size',
      rootGap: 'Unit Fraction Partitioning',
      prerequisiteFor: 'Comparing and Adding Fractions',
      evidence: 'Student believes 1/8 is bigger than 1/4 because the number 8 is larger than the number 4.',
      plan: [
        { day: 'Day 1', task: 'Fold two identical paper strips. Cut one into 4 parts and the other into 8 parts.' },
        { day: 'Day 2', task: 'Compare the size of one 1/4 piece next to one 1/8 piece on the desk.' },
        { day: 'Day 3', task: 'Draw rotis on blackboard and shade 1/2, 1/4, and 1/8 to see slice size.' },
        { day: 'Day 4', task: 'Practice the rule: more equal parts means each piece is smaller.' },
        { day: 'Day 5', task: 'Complete 1-page paper worksheet comparing unit fractions.' }
      ],
      reassessmentResult: 'Student correctly identified that 1/3 is bigger than 1/6 using paper fold evidence.'
    },
    {
      id: 'demo-c5-3',
      name: 'Amit Patel',
      rollNo: 19,
      gradeLabel: 'Class 5A',
      topic: 'Place Value and Regrouping',
      status: 'On Track',
      statusType: 'good',
      mastery: 88,
      question: 'In the number 4,520, what is the value of the digit 5?',
      options: ['5', '50', '500', '5,000'],
      correctOption: '500',
      studentChoice: '500',
      observedMistake: 'None observed. Student answered with correct positional reasoning.',
      rootGap: 'Place value foundation is solid',
      prerequisiteFor: 'Multi-digit Multiplication',
      evidence: 'Correctly expanded 4,520 as 4 thousands, 5 hundreds, and 2 tens.',
      plan: [
        { day: 'Day 1', task: 'Practice 2-digit by 2-digit multiplication using area model.' },
        { day: 'Day 2', task: 'Solve word problems involving price calculations in local currency.' },
        { day: 'Day 3', task: 'Peer-tutor a classmate on place value columns.' },
        { day: 'Day 4', task: 'Independent practice with 3-digit multiplication.' },
        { day: 'Day 5', task: 'Short check on multi-digit multiplication fluency.' }
      ],
      reassessmentResult: 'Student demonstrates consistent mastery across 4-digit place value and multiplication.'
    }
  ]
};

export function LandingDemoSection() {
  const [selectedClassId, setSelectedClassId] = useState<string>(DEFAULT_CLASS_ID);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const activeClassConfig = getClassConfig(selectedClassId);
  const classStudents = MULTICLASS_DEMO_DATA[selectedClassId] || MULTICLASS_DEMO_DATA.class_5;
  const currentStudent = classStudents[selectedStudentIndex] || classStudents[0];

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudentIndex(0);
    setActiveWorkflowStep(1);
  };

  return (
    <section id="demo" className="border-b border-border px-4 sm:px-8 py-12 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-muted-foreground dark:text-muted-foreground">
            <span className="text-primary font-bold">04</span>
            <span>/</span>
            <span>INTERACTIVE WORKFLOW CASE FILES</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal mt-1 text-foreground">
            How the Agent Runs in Five Steps
          </h2>
        </div>
        <p className="text-sm font-mono text-muted-foreground dark:text-muted-foreground max-w-md">
          Select a class and student record below to test diagnostic checking, DAG backtracking, and 5-day practice sequences.
        </p>
      </div>

      {/* Class Selector Bar */}
      <div className="mb-6 p-4 border border-border bg-muted dark:bg-card">
        <div className="text-sm font-mono uppercase tracking-wider text-muted-foreground dark:text-muted-foreground mb-2 font-bold">
          Select Grade to Explore Curriculum Cases:
        </div>
        <ClassSelector
          selectedClassId={selectedClassId}
          onSelectClass={handleClassChange}
        />
      </div>

      {/* Stepper Buttons (Hairline Editorial Numbered Navigation) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 font-mono text-sm uppercase">
        {[
          { num: 1, label: '01. Select Student' },
          { num: 2, label: '02. Check Learning' },
          { num: 3, label: '03. Find Gaps' },
          { num: 4, label: '04. Practice Plan' },
          { num: 5, label: '05. Check Again' },
        ].map((step) => {
          const isActive = activeWorkflowStep === step.num;
          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveWorkflowStep(step.num as 1 | 2 | 3 | 4 | 5)}
              className={`min-h-[44px] p-2.5 border text-center font-bold cursor-pointer transition-none ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Interactive Stepper Content Card */}
      <div className="border-2 border-border bg-card p-5 sm:p-7 shadow-xs">
        {/* Student selection bar */}
        <div className="flex flex-wrap items-center justify-between pb-4 mb-5 border-b border-border gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground dark:text-muted-foreground uppercase font-bold">
              {activeClassConfig.label} Case Records:
            </span>
            <div className="flex gap-2">
              {classStudents.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStudentIndex(idx)}
                  className={`min-h-[36px] px-3 border text-sm font-mono cursor-pointer transition-none ${
                    selectedStudentIndex === idx
                      ? 'border-border bg-foreground text-background dark:bg-card dark:text-foreground font-bold'
                      : 'border-border bg-transparent text-foreground hover:bg-muted'
                  }`}
                >
                  {s.name} ({s.gradeLabel})
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm font-mono text-muted-foreground dark:text-muted-foreground">
            Roll No: #{currentStudent.rollNo}
          </div>
        </div>

        {/* STEP 1 */}
        {activeWorkflowStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 1: Student Diagnostic Profile</h3>
              <span className="text-sm font-mono px-2 py-0.5 border border-border bg-muted dark:bg-card">
                Initial Status: {currentStudent.status}
              </span>
            </div>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground leading-relaxed">
              The teacher or agent selects <strong>{currentStudent.name}</strong> from {currentStudent.gradeLabel}. Current evaluated topic: <em>{currentStudent.topic}</em>. Initial estimated mastery is {currentStudent.mastery}%.
            </p>

            <div className="border border-border p-4 bg-muted dark:bg-card grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-mono">
              <div>
                <span className="text-muted-foreground dark:text-muted-foreground uppercase block text-sm">Student Name</span>
                <strong className="text-sm">{currentStudent.name}</strong>
              </div>
              <div>
                <span className="text-muted-foreground dark:text-muted-foreground uppercase block text-sm">Topic Under Assessment</span>
                <strong>{currentStudent.topic}</strong>
              </div>
              <div>
                <span className="text-muted-foreground dark:text-muted-foreground uppercase block text-sm">Diagnostic Standing</span>
                <strong className={currentStudent.statusType === 'critical' ? 'text-primary' : 'text-foreground font-bold'}>
                  {currentStudent.status} ({currentStudent.mastery}%)
                </strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(2)}
                className="min-h-[44px] px-5 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold hover:bg-primary cursor-pointer"
              >
                Next: Check Learning
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {activeWorkflowStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 2: Diagnostic Check Question</h3>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground">
              The student answers a diagnostic question calibrated specifically for {currentStudent.topic}.
            </p>

            <div className="border border-border p-4 bg-card space-y-3">
              <div className="text-sm font-mono text-primary font-bold uppercase">Diagnostic Item:</div>
              <div className="text-sm font-bold font-mono">{currentStudent.question}</div>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono pt-2">
                {currentStudent.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`p-2 border ${
                      opt === currentStudent.studentChoice
                        ? 'border-primary bg-primary text-primary-foreground font-bold'
                        : 'border-border'
                    }`}
                  >
                    Option {i + 1}: {opt}
                    {opt === currentStudent.studentChoice && ' (Student Choice)'}
                    {opt === currentStudent.correctOption && ' (Correct Key)'}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(1)}
                className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase hover:bg-muted cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(3)}
                className="min-h-[44px] px-5 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold hover:bg-primary cursor-pointer"
              >
                Next: Find Gaps
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {activeWorkflowStep === 3 && (
          <div className="space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 3: Root Cause Analysis</h3>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground">
              The system analyzes the error and traces the prerequisite gap back through the curriculum DAG.
            </p>

            <div className="border border-border p-4 bg-muted dark:bg-card space-y-3 text-sm">
              <div>
                <span className="font-mono text-primary font-bold uppercase block text-sm">Observed Error Pattern:</span>
                <p className="text-foreground mt-0.5">{currentStudent.observedMistake}</p>
              </div>
              <div className="border-t border-border pt-2">
                <span className="font-mono text-muted-foreground dark:text-muted-foreground uppercase block text-sm">Diagnosed Root Gap:</span>
                <strong className="text-sm font-serif text-primary">{currentStudent.rootGap}</strong>
              </div>
              <div className="border-t border-border pt-2">
                <span className="font-mono text-muted-foreground dark:text-muted-foreground uppercase block text-sm">Foundational Prerequisite For:</span>
                <p>{currentStudent.prerequisiteFor}</p>
              </div>
              <div className="border-t border-border pt-2">
                <span className="font-mono text-muted-foreground dark:text-muted-foreground uppercase block text-sm">Diagnostic Evidence:</span>
                <p className="italic text-foreground/80 dark:text-muted-foreground">{currentStudent.evidence}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(2)}
                className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase hover:bg-muted cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(4)}
                className="min-h-[44px] px-5 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold hover:bg-primary cursor-pointer"
              >
                Next: Practice Plan
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {activeWorkflowStep === 4 && (
          <div className="space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 4: 5-Day Classroom Practice Plan</h3>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground">
              A concrete, manipulative-assisted 5-day classroom sequence for the teacher.
            </p>

            <div className="border border-border p-4 bg-card space-y-2.5">
              {currentStudent.plan.map((p, i) => (
                <div key={i} className="flex gap-3 text-sm border-b border-border pb-2 last:border-b-0 last:pb-0">
                  <span className="font-mono font-bold text-primary w-14 shrink-0">{p.day}:</span>
                  <span className="text-foreground/80 dark:text-muted-foreground">{p.task}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(3)}
                className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase hover:bg-muted cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(5)}
                className="min-h-[44px] px-5 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold hover:bg-primary cursor-pointer"
              >
                Next: Check Again
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {activeWorkflowStep === 5 && (
          <div className="space-y-4">
            <h3 className="font-serif text-xl sm:text-2xl font-bold">Step 5: Verification & Check Again</h3>
            <p className="text-sm text-foreground/80 dark:text-muted-foreground">
              After 5 days of practice, the student is checked again to verify mastery.
            </p>

            <div className="border border-[var(--status-good-border)] p-4 bg-[var(--status-good-bg)] space-y-2">
              <div className="flex items-center gap-2 text-foreground font-mono font-bold text-sm uppercase">
                <CheckCircle size={16} className="text-[var(--status-good)]" />
                <span>Learning Verified on Paper & Slate</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {currentStudent.reassessmentResult}
              </p>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveWorkflowStep(4)}
                className="min-h-[44px] px-4 border border-border text-sm font-mono uppercase hover:bg-muted cursor-pointer"
              >
                Back to Step 4
              </button>
              <Link
                href="/assessment"
                className="min-h-[44px] px-5 bg-primary text-primary-foreground text-sm font-mono uppercase font-bold hover:bg-primary inline-flex items-center cursor-pointer shadow-xs"
              >
                Assess Test Now
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
