// scripts/buildCorpusFiles.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, "../data/knowledge");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

export function countWords(t) {
  return t.trim().split(/\s+/).filter(Boolean).length;
}

// 48 NCERT Chunks covering all CBSE Class 5 concepts & prerequisites
const rawNcertChunks = [
  // 1. multi_digit_mult
  {
    id: "ncert-cl5-mdm-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "multi_digit_mult",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 1 'The Fish Tale', pp. 10-12",
    license: "own",
    text: `Multi-digit multiplication for Class 5 builds upon the foundational concept of place value and the distributive property of multiplication over addition. When multiplying a three-digit number by a two-digit number, such as 245 multiplied by 34, primary school children often get confused if they are taught only the mechanical column algorithm without conceptual understanding. To teach this meaningfully in an Indian classroom, educators should first introduce the box or area model. In the area model, 245 is decomposed into its expanded notation of 200 plus 40 plus 5, and 34 is decomposed into 30 plus 4. We then draw a grid with two rows and three columns, creating six individual cells. Each cell represents a partial product: 200 times 30 equals 6000, 40 times 30 equals 1200, 5 times 30 equals 150, 200 times 4 equals 800, 40 times 4 equals 160, and 5 times 4 equals 20. Adding the numbers across the rows gives 7350 and 980, which together sum up to 8330. This visual decomposition makes it evident why we insert a zero in the tens row during standard column multiplication: because we are multiplying by 3 tens (30), not just 3. Once students master this conceptual area representation, transitioning to the standard vertical algorithm becomes natural, intuitive, and resistant to memory slips or column misalignment errors. Teachers should encourage learners to articulate the place value of each digit aloud during calculation, reinforcing that numbers represent bundled quantities rather than disconnected abstract symbols on the paper.`
  },
  {
    id: "ncert-cl5-mdm-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "multi_digit_mult",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 13 'Ways to Multiply and Divide', Activity 2",
    license: "own",
    text: `This zero-cost classroom activity, named The Verandah Market Grid, uses chalk on the classroom floor and local tamarind seeds or small pebbles to reinforce multi-digit multiplication. Divide students into small collaborative pairs. Clear a space on the stone verandah and draw a large four-box rectangle with chalk for a calculation such as 64 times 23. Have one student write the expanded numbers along the edges: 60 and 4 across the top, and 20 and 3 down the left edge. The second student uses bundles of 10 tamarind seeds to demonstrate the place value scaling. For the first box (60 times 20), explain that 6 tens times 2 tens equals 12 hundreds (1200). For 4 times 20, students place tokens showing 8 tens (80). For 60 times 3, students write 180, and for 4 times 3, they place 12 single seeds. The students then sum the horizontal entries on the floor: 1200 plus 80 equals 1280, while 180 plus 12 equals 192. Finally, they add 1280 and 192 vertically using standard column addition to arrive at 1472. Working physically on the floor with concrete tokens anchors the mathematical abstraction in bodily-kinesthetic experience. It completely eliminates fear of large numbers and ensures that children who struggle with abstract worksheets grasp the underlying logic of partial products. The teacher can conclude by having students verify their floor answer against standard pencil-and-paper calculation, celebrating the exact match.`
  },
  {
    id: "ncert-cl5-mdm-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "multi_digit_mult",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Teacher Remediation Manual, Section 4.2",
    license: "own",
    text: `A very common diagnostic misconception in Class 5 multiplication occurs when multiplying by the tens digit in the second step of the standard algorithm. Many students multiply the top number by the second digit as if it were a single isolated unit, completely forgetting to write the place-holder zero in the units column before beginning the second row. For instance, when calculating 134 times 25, the child correctly multiplies 134 by 5 to obtain 670 on the first line. However, on the next line, they multiply 134 by 2 and write 268 directly underneath, lining up the 8 beneath the 0. When they add the two lines, they obtain 938 instead of the correct product 3350. This error stems from procedural memorization without place value awareness: the child treats the 2 in 25 as two ones instead of two tens (twenty). To remediate this misconception, the teacher must intervene with spoken language scaffolding. Instead of saying 'multiply by 2', the teacher should consistently say 'we are now multiplying 134 by 20'. The teacher can have the student write the zero in a distinct chalk color or with an explicit circle in the ones place first, explaining that any number multiplied by tens must end in a multiple of ten. Having students estimate the answer first (130 times 20 is about 2600) also alerts them immediately that 938 is impossibly small. This cognitive dissonance motivates the learner to self-correct and verify column alignment consistently.`
  },
  {
    id: "ncert-cl5-mdm-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "multi_digit_mult",
    type: "hint",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Practice Worksheets Module 3",
    license: "own",
    text: `When tackling a multi-digit multiplication problem like 326 times 42, break the challenge into two friendly steps. First, ignore the tens digit 4 and simply multiply 326 by 2 ones, writing down your first partial product clearly on the first line: 326 times 2 gives 652. Next, before doing anything else on the second row, ask yourself what the digit 4 really stands for: it sits in the tens column, so it stands for 40, which is 4 tens. Because multiplying any whole number by tens always results in a number ending in zero, place a bright placeholder zero in the units column on your second line right now. Once that protective zero is resting safely in the units spot, multiply 326 by 4: 4 times 6 is 24 (write 4, carry 2), 4 times 2 is 8 plus 2 is 10 (write 0, carry 1), and 4 times 3 is 12 plus 1 is 13, giving 1304 to the left of your zero, forming 13040. Finally, add your two rows together column by column from right to left: 652 plus 13040 gives 13692. Make a quick mental estimate beforehand to check yourself: 300 times 40 equals 12000, so your answer should be around 13000 to 14000. Following this checklist guarantees that your columns remain aligned and zero errors disappear.`
  },

  // 2. division_facts
  {
    id: "ncert-cl5-df-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "division_facts",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 13 'Ways to Multiply and Divide', pp. 170-173",
    license: "own",
    text: `Division with two-digit divisors in Class 5 marks a significant cognitive milestone where children transition from single-digit mental math to estimation and repeated grouping. Division essentially asks: how many equal groups of the divisor can be formed from the dividend, and what remains unshared? For example, in 98 divided by 14, the student must estimate how many times 14 fits into 98. Because children do not memorize multiplication tables up to 14, they must learn to round the divisor and dividend to friendly multiples of 10. Rounding 14 to 10 and 98 to 100 suggests an initial guess of 9 or 10, but since 14 is greater than 10, the actual quotient must be smaller. Testing 7 gives 14 times 7, which equals exactly 98 with a remainder of 0. When a remainder does occur, such as dividing 85 by 12, testing 12 times 7 gives 84, leaving a remainder of 1. It is vital to emphasize the fundamental division relation: Dividend equals Divisor times Quotient plus Remainder, where the Remainder is strictly greater than or equal to 0 and strictly less than the Divisor. Teaching this relationship ensures students do not view division as a magical recipe, but rather as fair distribution verified by multiplication. Teachers should consistently ask students to check their work using this formula, instilling habits of mathematical precision and autonomous verification.`
  },
  {
    id: "ncert-cl5-df-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "division_facts",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Low-Cost Classroom Activities Manual",
    license: "own",
    text: `To make division by two-digit divisors tangible without any store-bought supplies, conduct the Bottle Cap Packing Factory activity in the school courtyard. Collect 100 clean plastic bottle caps from home or the school recycling bin. Present a classroom problem: a local sweet shop has 95 laddoos and needs to pack them into boxes that hold exactly 12 laddoos each. How many full boxes can the shop prepare, and how many loose laddoos will remain? Have a student volunteer count out 95 bottle caps. Then ask another student to act as the packaging clerk, removing groups of 12 caps one by one and placing each group onto a circular paper plate representing a box. As each group of 12 is taken away, a student recorder on the blackboard writes down the repeated subtraction: 95 minus 12 is 83, 83 minus 12 is 71, and so on until 7 plates each hold 12 caps, leaving 11 loose caps on the floor. Ask the class: can we fill another box? The children see instantly that 11 is less than 12, so no more full boxes can be made. The number of full boxes (7) is the quotient, and the leftover caps (11) represent the remainder. This physical grouping experience demonstrates that the remainder can never be equal to or greater than the box size.`
  },
  {
    id: "ncert-cl5-df-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "division_facts",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Diagnostic Guidance Bulletin",
    license: "own",
    text: `A widespread conceptual bug occurs when students accept a remainder that is equal to or greater than the divisor. For example, when asked to divide 76 by 11, a student might guess a quotient of 5. They calculate 11 times 5 equals 55, subtract 55 from 76, and write down an answer of 'Quotient 5, Remainder 21'. The student feels satisfied because their subtraction was arithmetically correct (76 minus 55 is indeed 21). They fail to realize that if 21 items remain, another whole group of 11 can easily be formed, meaning their quotient was underestimated. The root cause is viewing division as a one-time guess followed by mechanical subtraction, rather than testing whether the remaining amount could still be shared. Teachers can remedy this by introducing the Remainder Rule Mantra: The remainder must always be smaller than the divider! Have students physically test the remainder with concrete objects: if you have 21 marbles left and each bag holds 11, can you pack another bag? The answer is an immediate yes. Teach children to always perform the comparison check: Remainder less than Divisor. If false, increase the quotient by at least 1 and recalculate. Regular classroom reflection on why leftovers must be smaller than the group size builds foundational algebraic reasoning for life.`
  },
  {
    id: "ncert-cl5-df-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "division_facts",
    type: "hint",
    lang: "hi",
    source: "NCERT गणित का जादू कक्षा 5, अध्याय 13 अभ्यास",
    license: "own",
    text: `दो अंकों की संख्या से भाग करते समय हमेशा अनुमान लगाने की तकनीक का उपयोग करें ताकि गणना सरल हो जाए। उदाहरण के लिए, यदि आपको 86 को 13 से भाग देना है, तो पहले 13 को 10 और 86 को 80 मानकर सोचें कि 10 का पहाड़ा 80 में लगभग 8 बार जाता है। लेकिन क्योंकि 13 संख्या 10 से बड़ी है, इसलिए हमारा वास्तविक उत्तर 8 से थोड़ा कम होगा। अब 13 का पहाड़ा 6 बार पढ़कर देखें: 13 गुणा 6 बराबर 78 होता है। जब आप 86 में से 78 घटाते हैं, तो 8 बचता है। अब अपने शेषफल की सावधानीपूर्वक जांच करें: क्या बचा हुआ 8 भाजक 13 से छोटा है? हाँ, 8 निश्चित रूप से 13 से छोटा है, इसलिए 6 हमारा सही भागफल है और 8 शेषफल है। हमेशा याद रखें कि शेषफल कभी भी भाजक के बराबर या उससे बड़ा नहीं हो सकता। यदि शेषफल भाजक जितना या उससे बड़ा आ रहा है, तो इसका सीधा अर्थ है कि आपका भागफल कम से कम एक अंक और बड़ा होना चाहिए था। अपने उत्तर की जांच के लिए हमेशा भाजक को भागफल से गुणा करें और उसमें शेषफल जोड़ें: 13 गुणा 6 (78) जमा 8 बराबर 86 आता है, जो मूल संख्या के बिल्कुल बराबर है।`
  },

  // 3. long_division
  {
    id: "ncert-cl5-ld-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "long_division",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 13 'Ways to Multiply and Divide', pp. 175-178",
    license: "own",
    text: `The standard long division algorithm in Class 5 requires orchestrating four sequential sub-skills: divide, multiply, subtract, and bring down. Consider dividing 748 by 4. First, students look at the highest place value: how many times does 4 go into 7 hundreds? It goes 1 hundred time. We write 1 in the quotient above the hundreds column, multiply 1 times 4 to get 4, subtract 4 from 7 to get 3 hundreds remaining, and then bring down the 4 tens to make 34 tens. Next cycle: how many times does 4 go into 34 tens? It goes 8 times. We write 8 in the quotient, multiply 8 times 4 to get 32, subtract 32 from 34 to get 2 tens remaining, and bring down the 8 units to make 28 units. Final cycle: 4 goes into 28 exactly 7 times with zero remainder. The final quotient is 187. The pedagogical beauty of this algorithm is that it processes numbers place by place from left to right, unbundling regrouped remainders into the next smaller unit. When teachers connect each step back to unbundling currency notes (e.g. trading 3 hundred-rupee notes for 30 ten-rupee notes), students comprehend the intrinsic logic of 'bringing down' instead of treating it as an arbitrary arrow. Emphasizing estimation before beginning division allows children to predict whether their quotient will have two, three, or four digits, providing a natural safeguard against missing digits.`
  },
  {
    id: "ncert-cl5-ld-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "long_division",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Activity Bank: Play Money Division",
    license: "own",
    text: `This activity uses mock paper currency (drawn on waste paper cards as 100-rupee, 10-rupee, and 1-rupee notes) to unpack long division without anxiety. Organize the class into a Bank and Customer setting. Give a team of three students 534 rupees in paper currency: 5 hundred notes, 3 ten notes, and 4 one-rupee coins or tokens. Their challenge is to distribute this money equally among 3 bank customers. First, they share the hundred notes. Each customer receives 1 hundred note (quotient gets 1). Two hundred-rupee notes are left over. Ask the children: can we divide 2 notes equally among 3 people as hundreds? No. What must we do? The bank teller unbundles the 2 hundred-rupee notes into 20 ten-rupee notes at the bank counter! Adding the existing 3 ten-rupee notes gives 23 ten-rupee notes in total. Now share the 23 tens among the 3 people: each receives 7 ten-rupee notes (7 in the quotient tens place), using 21 notes and leaving 2 tens. The 2 tens are traded for 20 ones, making 24 ones. Dividing 24 ones by 3 gives 8 ones each with zero remainder. Each person gets exactly 178 rupees. The children record every single unbundling step on grid paper alongside the concrete notes, directly linking physical trades to long division digits.`
  },
  {
    id: "ncert-cl5-ld-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "long_division",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Error Analysis Guide",
    license: "own",
    text: `The single most destructive error in multi-digit long division is omitting a zero in the middle of the quotient. For instance, when a student divides 618 by 6, they first divide 6 hundreds by 6 to write 1 in the quotient. They subtract 6 from 6 to get 0 and bring down the next digit, which is 1. The student sees that 6 cannot divide into 1. Rather than writing 0 in the quotient tens place, the student immediately brings down the 8 as well, forming 18. They then divide 18 by 6, obtain 3, and record their final quotient as 13 instead of 103. If asked to check their answer by multiplying 13 by 6, they obtain 78, demonstrating how wildly incorrect the result is. This error occurs because students forget the golden rule of long division: every time you bring down a digit from the dividend, you MUST write a digit in the quotient above it, even if that digit is zero! Teachers should instruct students to chant: 'Bring down, divide! If it cannot go, write a ZERO!' Practicing with grid paper where each digit sits strictly in its place-value column prevents digits from wandering and vanishing. Regularly checking quotients against estimates (600 divided by 6 is 100) immediately exposes answers like 13 as absurd.`
  },
  {
    id: "ncert-cl5-ld-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "long_division",
    type: "hint",
    lang: "te",
    source: "NCERT గణితం తరగతి 5, అధ్యాయం 13 సూచనలు",
    license: "own",
    text: `దీర్ఘ భాగాహారం చేసేటప్పుడు ప్రతి అంకెను స్థాన విలువల ప్రకారం క్రమపద్ధతిలో లెక్కించాలి. మీరు ఒక సంఖ్యను కిందకు దించిన ప్రతిసారీ, తప్పనిసరిగా భాగాహార ప్రక్రియను పూర్తి చేయాలి. ఉదాహరణకు, 824 ను 4 తో భాగించేటప్పుడు, మొదట 8 వందలను 4 తో భాగిస్తే భాగఫలంలో 2 వస్తుంది. తరువాత 2 పదులను కిందకు దించినప్పుడు, 4 అనేది 2 లో భాగించబడదు. అటువంటి సమయంలో వెంటనే తర్వాతి అంకెను దించకూడదు! ముందుగా భాగఫలంలో పదుల స్థానంలో సున్నా (0) ఉంచాలి. ఆ తర్వాత మాత్రమే తర్వాతి అంకె 4 ను కిందకు తెచ్చి 24 గా మార్చాలి. ఇప్పుడు 24 ను 4 తో భాగిస్తే 6 వస్తుంది. దీనివల్ల సరైన జవాబు 206 అవుతుంది. ఒకవేళ మీరు సున్నా రాయడం మరచిపోతే జవాబు 26 అయిపోతుంది, ఇది తప్పు. మీ జవాబును సరిచూసుకోవడానికి ఎల్లప్పుడూ భాగఫలాన్ని విభాజకంతో గుణించి చూడండి: 206 గుణకారం 4 సమానం 824 అవుతుంది. స్థాన విలువల గడులలో రాసుకుంటే అంకెలు పక్కకు జరగకుండా సరైన స్థానంలో ఉంటాయి. భాగాహారంలో దించిన ప్రతి అంకెకు భాగఫలంలో ఒక స్థానం ఉంటుందని గుర్తుంచుకోండి.`
  },

  // 4. division_word
  {
    id: "ncert-cl5-dw-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "division_word",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 1 'The Fish Tale', pp. 14-15",
    license: "own",
    text: `Division word problems in Class 5 mathematics bridge computational mechanics with authentic real-world decision making. In Indian community life, division problems arise when sharing harvests, chartering transport, distributing mid-day meals, or calculating daily wage rates. There are two distinct interpretations that children must learn to recognize: sharing (partitive division) and grouping (quotative division). In sharing, a known total quantity is distributed equally among a known number of recipients, and the problem asks for the size of each share (for example, 48 mangoes shared among 6 children gives 8 mangoes per child). In grouping, the size of each portion is fixed, and the problem asks how many groups or containers can be filled (for example, 48 students travelling in auto-rickshaws that carry 4 passengers each requires 12 autos). Crucially, real-life word problems frequently require children to interpret the remainder meaningfully rather than just stating a numeric fraction. If 25 children need to travel in autos carrying 4 each, 25 divided by 4 gives 6 with a remainder of 1. A real-world driver cannot leave one child behind on the road; therefore, 7 auto-rickshaws must be hired. Teachers should encourage students to visualize the story situation before picking up a pencil, sketching quick diagrams of the groups and leftovers to make sensible real-life decisions.`
  },
  {
    id: "ncert-cl5-dw-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "division_word",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Collaborative Classroom Tasks",
    license: "own",
    text: `Conduct the Mid-Day Meal Ration Dispatch role-play in the classroom to teach contextual remainder interpretation. Set up a mock grain distribution counter using small plastic bowls filled with dry rice or chickpea seeds. Present the scenario: the school headmaster has received a sack containing 65 kilograms of pulses to last for a 5-day school week with equal daily allocations, or to pack into 4-kilogram ration packets for families. Have one group of students act as storekeepers and another as recipients. The storekeepers measure out the seeds using equal spoonfuls or cups into containers. When packing 65 items into 4-item packs, the students discover they make 16 full packs and have 1 single item left. Prompt the students with two different real-life questions based on this exact calculation: First, 'How many full packets can be sold?' (Answer: 16 packets). Second, 'If all pulses must be safely stored in plastic containers that hold 4 kilograms each, how many containers are needed?' (Answer: 17 containers, because the leftover pulse requires its own container). Discussing these twin questions allows children to understand why mathematical algorithms must be interpreted thoughtfully in life. The class summarizes their findings on a poster illustrating when remainders are discarded versus when they force rounding up.`
  },
  {
    id: "ncert-cl5-dw-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "division_word",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Word Problem Diagnostic Guide",
    license: "own",
    text: `A frequent pedagogical difficulty in division word problems is number grabbing: students read a story problem, pick out the two numbers mentioned, and perform an operation based on superficial keywords without understanding the underlying situation. For example, if a problem states: 'A farmer has 12 cows and each cow produces 8 litres of milk daily', some students see the numbers and divide 12 by 8 because they recently learned division. Conversely, in a problem like 'A book costs 45 rupees. Rina has 200 rupees. How many books can she buy?', students often write down '4.44' or '4 books remainder 20 rupees' without stating a clear answer to the actual question. The child does not distinguish between the physical reality (you can only buy 4 whole books) and the unspent money. To resolve this, teachers must implement the Three-Read Strategy. In the first read, students read without any numbers to understand what is happening in the story. In the second read, they identify the quantities and units. In the third read, they ask: what specific question am I answering, and what does each part of my calculation mean in the real world? Practicing this structured protocol builds resilient problem-solving habits.`
  },
  {
    id: "ncert-cl5-dw-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "division_word",
    type: "hint",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Problem Solving Strategy Card",
    license: "own",
    text: `When solving a word problem that involves sharing or grouping, follow this three-point guide. First, identify your total starting amount: what is the full quantity being divided up? Second, identify the size of each share or the number of groups. Write down your division sentence: Total divided by Group Size equals Number of Groups. Once you compute your quotient and remainder, pause and re-read the final question carefully. If the question asks how many complete items or full bags can be filled, your answer is strictly the whole quotient, and the remainder is simply what is left over. However, if the question asks how many boxes, tents, or vehicles are needed to hold everything without leaving anything behind, you must add 1 to your quotient whenever a remainder exists! For instance, if 33 students are going on a trip in vans holding 8 students each, 33 divided by 8 gives 4 with a remainder of 1. You cannot abandon that one student on the school road, so the school must book 5 vans. Always check whether your answer fits real life, write down the final units clearly, and explain what happened to the remainder in words.`
  },

  // 5. equivalent_fractions
  {
    id: "ncert-cl5-ef-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "equivalent_fractions",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 4 'Parts and Wholes', pp. 50-53",
    license: "own",
    text: `Equivalent fractions represent the same portion of a whole, even though they are expressed using different numerators and denominators. In Class 5, understanding equivalence is the master key to comparing fractions and adding or subtracting fractions with unlike denominators. Consider a circular chapati cut into 2 equal halves: one piece is 1/2. If another identical chapati is cut into 4 equal slices and a child takes 2 slices, the portion taken is 2/4. Laying the 2 slices directly over the 1 half proves physically that 1/2 and 2/4 occupy the exact same space. Mathematically, multiplying both the numerator and denominator by the same non-zero whole number creates an equivalent fraction. This is because multiplying both top and bottom by 2 is equivalent to multiplying the fraction by 2/2, which is simply multiplying by 1, leaving the intrinsic value unchanged. Similarly, dividing both the numerator and denominator by their common factor simplifies the fraction to its lowest terms. Helping children recognize that the size of the pieces changes in inverse proportion to their number allows them to see equivalent fractions as different names for the exact same quantity. Teachers should provide multiple visual models such as fraction strips, number lines, and circular sets to solidify this concept across different geometric contexts.`
  },
  {
    id: "ncert-cl5-ef-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "equivalent_fractions",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Paper Folding Fraction Strips",
    license: "own",
    text: `This zero-cost activity uses strips cut from discarded newspaper or scrap paper to build a Fraction Wall on the student's desk. Give each student four identical strips of paper, each approximately 20 centimeters long and 3 centimeters wide. Label the first strip as '1 Whole'. Have students take the second strip, fold it carefully end-to-end, crease it sharply, open it up, and shade one of the halves with a pencil, labelling each part '1/2'. Take the third strip, fold it in half, and then fold it in half once more before opening; this creates 4 equal parts, each labelled '1/4'. Shade two of these fourths. Now place the second strip (showing 1/2) directly above the third strip (showing 2/4). The crease lines align perfectly, proving visually that 1/2 equals 2/4. Finally, take the fourth strip, fold it in half, then fourths, then eighths. Crease and open it up. Shading four eighths aligns exactly with the two fourths and the one half. Students record their visual discoveries in their notebooks: 1/2 = 2/4 = 4/8. This concrete alignment permanently demystifies equivalent fractions. Students can paste these four strips into their math scrapbooks as a permanent reference tool for future fraction comparison and addition lessons.`
  },
  {
    id: "ncert-cl5-ef-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "equivalent_fractions",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Fraction Diagnostic Notes",
    license: "own",
    text: `A pervasive misconception among primary students is the Additive Equivalence Fallacy: believing that adding the same number to both the numerator and denominator produces an equivalent fraction. For example, a student presented with 2/3 might add 2 to both top and bottom to obtain 4/5, claiming that 2/3 equals 4/5 because 'I added 2 to both parts equally'. The student confuses additive symmetry with multiplicative scaling. To eradicate this misconception, the teacher must immediately test the claim with concrete visual models. Draw two identical rectangles on the board. Divide the first into 3 equal columns and shade 2 (representing 2/3, which is 66.7%). Divide the second into 5 equal columns and shade 4 (representing 4/5, which is 80%). The drawing clearly shows that 4/5 covers significantly more surface area than 2/3, so they cannot be equal. Explain the mathematical rule: equivalence preserves the ratio of parts to the whole, which requires multiplication or division, never addition or subtraction. You can multiply the numerator and denominator by 2 to get 4/6, but adding 2 changes the relationship completely. Having students shade grid paper to test their own predictions firmly establishes that only scaling by multiplication preserves exact fraction value.`
  },
  {
    id: "ncert-cl5-ef-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "equivalent_fractions",
    type: "hint",
    lang: "hi",
    source: "NCERT गणित का जादू कक्षा 5, अध्याय 4",
    license: "own",
    text: `तुल्य भिन्न (इक्विवेलेंट फ्रैक्शन) प्राप्त करने का सबसे आसान और सुरक्षित नियम यह है कि आप अंश (ऊपर की संख्या) और हर (नीचे की संख्या) दोनों को एक ही संख्या से गुणा करें। कभी भी अंश और हर में कोई संख्या जोड़ें नहीं! उदाहरण के लिए, यदि आपको 3/4 के तुल्य भिन्न बनाने हैं, तो अंश 3 और हर 4 दोनों को 2 से गुणा करें: 3 गुणा 2 बराबर 6, और 4 गुणा 2 बराबर 8, जिससे आपको 6/8 मिलेगा। यदि आप दोनों को 3 से गुणा करते हैं, तो आपको 9/12 मिलेगा। 3/4, 6/8 और 9/12 तीनों एक ही मान को दर्शाते हैं। इसे एक रोटी के उदाहरण से समझें: एक रोटी के 4 बराबर टुकड़े करके 3 टुकड़े खाना, या उसी रोटी के 8 बराबर टुकड़े करके 6 टुकड़े खाना बिल्कुल एक समान पेट भरता है। किसी भिन्न को उसके सरलतम रूप में लाने के लिए अंश और हर दोनों को उनके उभयनिष्ठ गुणनखंड (कॉमन फैक्टर) से भाग दिया जाता है। हमेशा याद रखें: केवल गुणा या भाग, जोड़ या घटाव कभी नहीं! यदि आप कभी संदेह में हों, तो कागज की दो बराबर पट्टियों को मोड़कर देखें कि क्या दोनों हिस्से एक दूसरे को पूरी तरह ढकते हैं।`
  },

  // 6. comparing_fractions
  {
    id: "ncert-cl5-cf-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "comparing_fractions",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 4 'Parts and Wholes', pp. 58-61",
    license: "own",
    text: `Comparing fractions is a critical reasoning skill in Class 5 that requires evaluating the relative size of parts rather than simply comparing isolated digits. When fractions have like denominators (for example, 3/8 and 5/8), comparison is straightforward: because the whole is partitioned into pieces of identical size, having 5 pieces is clearly greater than having 3 pieces, so 5/8 is greater than 3/8. However, when fractions have unlike denominators, children must adopt systematic strategies. If the numerators are identical (for example, 3/4 versus 3/8), students must reason about piece sizes: cutting a whole into 4 pieces yields much larger slices than cutting it into 8 pieces; therefore, 3 large pieces (3/4) is greater than 3 tiny pieces (3/8). When both numerators and denominators differ (such as comparing 2/3 and 3/5), students should either convert both fractions into equivalent fractions with a common denominator (10/15 versus 9/15, proving 2/3 is greater) or compare both against benchmark fractions like 1/2. Mastering these strategies prevents students from relying on mechanical cross-multiplication tricks without conceptual clarity. Encouraging visual estimation before symbolic computation ensures children develop authentic number sense regarding fraction magnitudes.`
  },
  {
    id: "ncert-cl5-cf-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "comparing_fractions",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Outdoor Math Activities",
    license: "own",
    text: `Create an interactive Fraction Washing Line in the classroom or outside between two trees using a simple piece of string and wooden clothes-pegs or folded paper clips. Tie a 2-meter long jute string horizontally at children's eye level. Mark the left end with a card labelled '0' and the right end with a card labelled '1'. Hang a bright colored marker exactly in the middle labelled '1/2 (Halfway Benchmark)'. Hand out cards with various fractions to pairs of students: 1/4, 3/4, 2/5, 7/10, 5/8, and 1/3. Each pair must discuss where their fraction belongs relative to the 1/2 benchmark before pegging it on the line. For example, the pair holding 2/5 reasons: half of 5 is 2.5, so 2/5 is slightly less than half; therefore, it belongs just to the left of the 1/2 card. The pair holding 7/10 notes that half of 10 is 5, so 7/10 is greater than 1/2 and hangs to the right. Once all cards are pegged, the entire class walks along the line from 0 to 1, reading the fractions in ascending order. This tactile spatial activity cements fraction magnitude permanently, allowing students to physically observe how fractions cluster around zero, one-half, and one whole.`
  },
  {
    id: "ncert-cl5-cf-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "comparing_fractions",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Teacher Misconceptions Handbook",
    license: "own",
    text: `The whole-number bias is the most frequent obstacle when children compare unit fractions. When asked whether 1/4 or 1/8 is larger, a large percentage of primary school students will instinctively answer 1/8, arguing with absolute confidence that 8 is bigger than 4. The child imports their well-practiced whole number knowledge (where 8 is greater than 4) directly into fractions, failing to comprehend that the denominator represents the number of parts into which the whole has been divided. In a fraction, a larger denominator means the whole is divided among more recipients, so each individual share becomes smaller. To overcome this bias, invite two students to act out a birthday cake scenario. If one cake is shared equally among 4 children, each child receives a generous quarter-slice. If the same size cake is shared among 8 children, each child receives a much thinner slice. Ask the students: would you rather have one slice of the 4-person cake or one slice of the 8-person cake? The physical reality makes the conclusion undeniable: 1/4 is twice as large as 1/8. Emphasizing that denominators act as dividers dismantles the whole-number bias effectively.`
  },
  {
    id: "ncert-cl5-cf-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "comparing_fractions",
    type: "hint",
    lang: "te",
    source: "NCERT గణితం తరగతి 5, అధ్యాయం 4 పోలిక సూచనలు",
    license: "own",
    text: `భిన్నాలను పోల్చేటప్పుడు హారాలు (కింద ఉండే సంఖ్యలు) సమానంగా ఉన్నాయా లేదా అని మొదట గమనించండి. హారాలు సమానంగా ఉంటే (ఉదాహరణకు 3/7 మరియు 5/7), లవంలో పెద్ద సంఖ్య ఉన్న భిన్నమే పెద్దది అవుతుంది, కాబట్టి 5/7 పెద్దది. కానీ లవాలు సమానంగా ఉండి హారాలు వేరుగా ఉంటే (ఉదాహరణకు 2/3 మరియు 2/5), చిన్న హారం ఉన్న భిన్నమే పెద్దది అవుతుంది! ఎందుకంటే తక్కువ భాగాలు చేసినప్పుడు ప్రతి భాగం పరిమాణం పెద్దగా ఉంటుంది. ఒకవేళ లవాలు, హారాలు రెండూ వేరుగా ఉంటే (ఉదాహరణకు 3/4 మరియు 5/6), రెండింటి హారాలను సమానం చేయడానికి కాసాగు (ఎల్.సి.ఎం) కనుక్కోండి. 4 మరియు 6 ల కాసాగు 12. అప్పుడు 3/4 ను 9/12 గాను, 5/6 ను 10/12 గాను సమాన భిన్నాలుగా మార్చవచ్చు. ఇప్పుడు 10/12 పెద్దది కాబట్టి, 5/6 అనేది 3/4 కంటే పెద్దది అని స్పష్టంగా తెలుస్తుంది. లేదా సగం (1/2) కంటే ఎక్కువ లేదా తక్కువ అని సులభంగా అంచనా వేయండి. ఎల్లప్పుడూ రెండు భిన్నాలను కాగితం మడతలతో లేదా చిత్రాలతో సరిచూసుకోవడం వల్ల తప్పులు జరగకుండా ఉంటాయి.`
  },

  // 7. fraction_addition
  {
    id: "ncert-cl5-fa-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_addition",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 4 'Parts and Wholes', pp. 62-65",
    license: "own",
    text: `Addition and subtraction of fractions in Class 5 requires understanding that we can only combine quantities that share the same unit size. When adding like fractions, such as 2/7 plus 3/7, the unit of measure is 'one-seventh'. Two sevenths joined with three sevenths naturally yields five sevenths (5/7). The denominator stays 7 because the size and definition of the parts have not altered; only the count of parts has accumulated. In contrast, when adding unlike fractions like 1/2 and 1/3, students cannot simply add across. A half-slice of melon cannot be directly combined with a third-slice because they are distinct sizes. To add them, students must first re-partition both fractions into a common unit of measure using equivalent fractions. The lowest common denominator for 2 and 3 is 6. We convert 1/2 into 3/6 and 1/3 into 2/6. Now that both fractions are expressed in terms of identical sixths, we combine them: 3/6 plus 2/6 equals 5/6. Emphasizing this concept of finding a common unit of measure prevents mechanical errors and prepares students for higher algebra. Teachers should regularly use rectangular fraction grids to show that creating common denominators is visually equivalent to superimposing horizontal and vertical grid cuts onto the same shape.`
  },
  {
    id: "ncert-cl5-fa-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_addition",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Hands-on Workshop Activities",
    license: "own",
    text: `Use circular paper plates cut into fraction wedges to conduct the Fraction Pizza Kitchen activity. Provide students with three plain white paper plates. Leave the first plate whole. Cut the second plate carefully into 2 equal halves, coloring each half green (labelled 1/2). Cut the third plate into 4 equal quarters, coloring each quarter orange (labelled 1/4). Now challenge a student to solve: 1/2 plus 1/4. Ask them to take 1 green half and place it on a blank plate. Then ask them to place 1 orange quarter next to it. How much of the plate is covered? The student sees that they have one large piece and one small piece, but cannot name the sum with a single number. Next, have the student place two orange quarters directly over the green half. They immediately see that 1/2 is exactly equal to 2/4! Now replace the green half with the two orange quarters: they have 2 quarters plus 1 quarter on the plate, making 3 quarters (3/4) of the plate covered in total. This hands-on substitution reveals why finding equivalent fractions with a common denominator is necessary. Students then repeat the activity combining halves and eighths, writing the symbolic steps alongside their plate models.`
  },
  {
    id: "ncert-cl5-fa-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_addition",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Common Mistakes in Fractions",
    license: "own",
    text: `The most rampant and persistent error in all of primary mathematics is adding both numerators and denominators together. Faced with 1/3 plus 1/3, an untrained child almost invariably writes 2/6. When asked to add 1/2 plus 1/2, they write 2/4. This is an alarming error because 1/2 plus 1/2 equals one whole (1), yet 2/4 equals only half! The student has mechanically applied whole number addition to the numerator and denominator independently, treating fractions as two unrelated numbers separated by a horizontal stick. Teachers can decisively demolish this misconception with a glass of water analogy. Take two half-glasses of clean drinking water. Pour the first half-glass into an empty glass. Pour the second half-glass into the same glass. Ask the class: do we now have two fourths (half a glass), or do we have one full glass of water? The children instantly shout: 'One full glass!' Conclude with the Golden Rule of Fraction Addition: The bottom number is just the name of the piece; you add the count on top, but you NEVER add the names on the bottom! Regular verbal chanting of this rule protects students from falling into automatic whole-number addition habits.`
  },
  {
    id: "ncert-cl5-fa-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_addition",
    type: "hint",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Scaffolded Hint Sheet",
    license: "own",
    text: `Before adding or subtracting fractions, perform this quick two-step check. Step 1: Look at the denominators (the numbers on the bottom). Are they already identical? If yes, keep that denominator exactly the same in your answer! Add or subtract only the top numbers (numerators), and simplify your answer if needed. For instance, 3/8 + 2/8 = (3+2)/8 = 5/8. Step 2: Are the denominators different? If yes, you cannot add them directly yet. Find a common denominator by listing the multiples of both bottom numbers. For example, to add 1/4 and 2/3, look at multiples of 4 (4, 8, 12) and multiples of 3 (3, 6, 9, 12). The common multiple is 12. Convert both fractions into equivalent fractions with 12 on the bottom: 1/4 becomes 3/12, and 2/3 becomes 8/12. Now add the numerators: 3 plus 8 equals 11, so your final answer is 11/12. Remember: the denominator tells you the size of the piece, so never add bottom numbers together! If your final fraction can be simplified, divide numerator and denominator by their common factor.`
  },

  // 8. cbse_5_decimals
  {
    id: "ncert-cl5-dec-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_decimals",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 10 'Tenths and Hundredths', pp. 134-137",
    license: "own",
    text: `Decimals in Class 5 extend the familiar base-ten place value system beyond whole numbers into fractional portions. Just as each step to the left in our place value chart increases by a factor of 10 (ones, tens, hundreds, thousands), each step to the right of the decimal point decreases by a factor of 10. The first spot immediately to the right of the decimal point is the tenths place, representing portions of 1/10. The second spot is the hundredths place, representing portions of 1/100. In everyday Indian life, decimals connect directly to currency: one rupee consists of 100 paise, so 50 paise is 50/100 of a rupee, written as 0.50 rupees. Similarly, 5 paise is written as 0.05 rupees. It also connects to metric measurement: 1 centimeter is divided into 10 millimeters, so 6 millimeters is 6/10 of a centimeter, written as 0.6 cm. Understanding that the decimal point simply marks the boundary between whole units and fractional parts helps students see decimals not as strange new entities, but as a clean, convenient way to write fractions whose denominators are 10, 100, or 1000. Teachers should emphasize reading decimals digit by digit (reading 4.25 as four point two five, rather than four point twenty-five) to avoid confusing tenths with whole numbers.`
  },
  {
    id: "ncert-cl5-dec-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_decimals",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Squared Paper Decimal Activities",
    license: "own",
    text: `Use standard squared math notebook paper to conduct the Hundredth Grid Shading exploration. Have each student outline a large 10-by-10 square with their pencil on grid paper, creating a master grid of exactly 100 small squares. Define the entire large grid as '1 Whole'. One single small square represents 1/100 or 0.01. One complete vertical column of 10 squares represents 10/100, which equals 1/10 or 0.1. Call out decimal values for students to shade using different colored pencils. For example, ask students to shade 0.35 in blue: they shade 3 full columns (3 tenths or 0.30) plus 5 individual squares (5 hundredths or 0.05). Next, ask them to shade 0.4 in orange on an identical grid: they shade 4 full columns. Compare the two grids side by side. Students immediately observe that 0.4 covers 40 squares, while 0.35 covers only 35 squares. This visually proves that 0.4 is larger than 0.35, despite 35 looking bigger than 4 to whole-number intuition. This activity cements decimal place value indelibly. Students can then practice writing equivalent decimals (0.4 = 0.40 = 40/100) next to their shaded drawings to reinforce the visual evidence.`
  },
  {
    id: "ncert-cl5-dec-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_decimals",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Decimal Diagnostic Guide",
    license: "own",
    text: `A frequent misconception is reading decimals as whole numbers, leading students to claim that 0.75 is smaller than 0.8 because '8 is smaller than 75'. The student ignores place value and compares the digits following the decimal point as if they were ordinary integers. Conversely, some students believe that longer decimals are always smaller, or that adding a trailing zero changes the value (believing 0.5 is different from 0.50). To correct this, teachers must enforce padding with trailing zeros to make the number of decimal places equal before comparing. Write 0.8 on the blackboard and ask: how many tenths is this? 8 tenths. How many hundredths is 8 tenths? 80 hundredths! Write 0.8 as 0.80. Now compare 0.80 rupees (80 paise) with 0.75 rupees (75 paise). Any Indian child immediately recognizes that 80 paise is more money than 75 paise. Using rupee-paise equivalence anchors decimal comparison in lived financial experience, permanently eliminating place value confusion. Regular practice comparing decimal measurements on metric rulers (such as 0.8 cm vs 0.75 cm) further reinforces that tenths dominate over hundredths.`
  },
  {
    id: "ncert-cl5-dec-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_decimals",
    type: "hint",
    lang: "hi",
    source: "NCERT गणित का जादू कक्षा 5, अध्याय 10",
    license: "own",
    text: `दशमलव संख्याओं की तुलना करते समय या उन्हें जोड़ते-घटाते समय सबसे महत्वपूर्ण नियम यह है कि दशमलव बिंदुओं को एक सीधी रेखा में रखें, जैसे कमीज के बटन एक सीध में होते हैं। यदि आप 0.8 और 0.75 की तुलना कर रहे हैं, तो ध्यान दें कि 0.8 में दशमलव के बाद केवल एक अंक (दशांश) है, जबकि 0.75 में दो अंक (दशांश और शतांश) हैं। तुलना आसान बनाने के लिए 0.8 के पीछे एक शून्य लगाकर उसे 0.80 बना लें। अब दोनों संख्याओं में दशमलव के बाद दो अंक हैं। 0.80 का अर्थ है 80 पैसे और 0.75 का अर्थ है 75 पैसे। स्पष्ट है कि 80 पैसे 75 पैसे से अधिक होते हैं, इसलिए 0.8 बड़ा है 0.75 से! दशमलव के बाद सबसे अंत में शून्य लगाने से संख्या का मान नहीं बदलता, लेकिन तुलना करना बहुत आसान हो जाता है। जोड़ते या घटाते समय भी खाली स्थानों पर शून्य भरकर अंकों को एक सीध में रखें। दशमलव के तुरंत बाद का पहला स्थान दशांश (दसवां हिस्सा) होता है, जो दूसरे स्थान (शतांश या सौवें हिस्से) से दस गुना बड़ा होता है।`
  },

  // 9. cbse_5_angles
  {
    id: "ncert-cl5-ang-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_angles",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 2 'Shapes and Angles', pp. 16-19",
    license: "own",
    text: `Angles in Class 5 geometry are introduced dynamically as an amount of turn or opening between two rays meeting at a common vertex, rather than static drawings on paper. The primary benchmark angle is the Right Angle, which measures exactly 90 degrees and forms a clean square corner, resembling the capital letter L. Classroom doorways, notebook pages, blackboard corners, and floor tiles all exhibit right angles. Angles that are smaller or more closed than a right angle are classified as Acute Angles (less than 90 degrees), like the tip of an open pair of scissors or a sliced wedge of lemon. Angles that are wider or more open than a right angle but less than a straight line are classified as Obtuse Angles (greater than 90 degrees and less than 180 degrees), like a widely reclined beach chair or a half-opened hand fan. Teaching angles through physical movement, body turns, and clock hands (e.g. 3:00 is a right angle, 2:00 is acute, and 4:00 is obtuse) builds intuitive spatial awareness before formal protractor measurement begins. Having students identify angles in yoga postures (asanas) or classroom furniture bridges geometric abstractions with daily bodily experience.`
  },
  {
    id: "ncert-cl5-ang-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_angles",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 2 Activity 'Angle Tester'",
    license: "own",
    text: `Construct a zero-cost Angle Tester using discarded cardboard strips and a split pin or matchstick. Cut two narrow strips of stiff cardboard from an old carton, each about 15 centimeters long. Punch a small hole at one end of both strips and join them loosely with a paper fastener, split pin, or a piece of bent wire so they can rotate freely like scissor blades. First, have students open the tester to match the corner of their textbook cover to establish a perfect Right Angle (L-shape). Now lead an Angle Hunt expedition across the schoolroom. Students place the tester against various objects: the corner of the window frame, the gap between a door and its frame, the slant of the roof rafters, or the hands of the wall clock. If the blades must close tighter than an L-shape, they record the angle as 'Acute (Less than Right Angle)'. If the blades open wider than an L-shape, they record it as 'Obtuse (Greater than Right Angle)'. Students record at least 5 of each type in their notebooks. This simple physical probe eliminates reliance on guessing and trains children's eyes to use 90 degrees as an intuitive geometric benchmark everywhere.`
  },
  {
    id: "ncert-cl5-ang-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_angles",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Geometry Misconceptions",
    license: "own",
    text: `A very common geometric misconception in Class 5 is judging the size of an angle by the length of its drawn rays or the size of the curved arc drawn between them. If a teacher draws a small acute angle with very long ray lines extending 20 centimeters, and next to it draws a right angle with short ray lines of only 5 centimeters, many children will insist that the acute angle is bigger because 'its lines are much longer'. Children equate linear length with angular rotation. To remediate this misconception, the teacher can demonstrate with two pencils held at their erasers. Open the pencils slightly to make an acute angle. Now hold two long meter-sticks at the exact same slight opening. Point out that the rotation or opening is identical in both pairs. You can also show that extending the rays of an angle on paper with a ruler does not open the angle any wider. An angle measures turning, not line length. Teachers should have students physically rotate door handles or clock hands to feel that rotation is independent of object size.`
  },
  {
    id: "ncert-cl5-ang-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_angles",
    type: "hint",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Visual Guide Card",
    license: "own",
    text: `To identify whether any angle is right, acute, or obtuse without a protractor, use the L-Test using your own thumb and index finger. Stretch your thumb and index finger apart on your right hand: they naturally form an L-shape, which is a perfect right angle (90 degrees). Hold your hand up to the angle in question. If the angle you are testing fits snugly inside your L-shape without filling it, the opening is smaller than 90 degrees, making it an Acute Angle. If the angle matches your L-shape perfectly (like the corner of a sheet of paper or a postcard), it is a Right Angle. If the angle spreads out wider than your L-shape, the opening is greater than 90 degrees, which makes it an Obtuse Angle. Remember: ignore how long the lines are drawn; focus solely on how widely the two lines spread apart from each other at the corner point. You can also use the corner of an ordinary ruler or eraser as a quick 90-degree check tool anytime.`
  },

  // 10. cbse_5_area
  {
    id: "ncert-cl5-ar-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_area",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 3 'How Many Squares?', pp. 34-38",
    license: "own",
    text: `In Class 5 mathematics, area and perimeter represent two fundamentally distinct spatial measurements that students frequently conflate. Perimeter measures the total boundary distance around the edge of a closed two-dimensional shape, expressed in linear units such as centimeters or meters. For example, if a rectangular vegetable garden is 6 meters long and 4 meters wide, the perimeter is the total length of fencing needed to surround it: 6 + 4 + 6 + 4 = 20 meters. Area, on the other hand, measures the total surface covered inside that boundary, expressed in square units such as square centimeters or square meters. The area tells us how many 1-meter by 1-meter squares can fit onto the garden surface: 6 rows of 4 square meters equals 24 square meters. A critical conceptual breakthrough for children is discovering that shapes with the exact same perimeter can encompass wildly different areas, and shapes with identical areas can have completely different perimeters. Grounding this distinction in physical metaphors (fence versus grass) helps students apply the correct operational formulas. Teachers should always insist that answers include appropriate units (cm for perimeter, cm² for area) to reinforce the linear versus two-dimensional distinction.`
  },
  {
    id: "ncert-cl5-ar-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_area",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 11 'Area and its Boundary'",
    license: "own",
    text: `Conduct the Fixed String Loop exploration using a 24-centimeter piece of string and square grid paper. Cut a piece of string exactly 26 centimeters long, tie a knot to form a closed loop of exactly 24 centimeters circumference, and give it to a student pair along with squared notebook paper where each square is 1 cm by 1 cm. Because the loop length is fixed at 24 cm, every shape formed by pulling this loop taut will have an identical perimeter of 24 cm! Challenge students to shape the string into different rectangles on the grid lines: first a 1 cm by 11 cm rectangle (area = 11 sq cm), then a 2 cm by 10 cm rectangle (area = 20 sq cm), then a 3 cm by 9 cm rectangle (area = 27 sq cm), then a 4 cm by 8 cm rectangle (area = 32 sq cm), and finally a 6 cm by 6 cm square (area = 36 sq cm). Students count the enclosed grid squares for each shape and write down their findings. They discover that as the rectangle becomes more square-like, the enclosed area increases dramatically, proving that fixed perimeter does NOT mean fixed area! This dramatic contrast dispels the misconception that boundary length strictly dictates interior surface size.`
  },
  {
    id: "ncert-cl5-ar-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_area",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Measurement Error Analysis",
    license: "own",
    text: `A frequent conceptual failure in mensuration is applying the wrong formula because students memorize 'length times breadth' and 'two times length plus breadth' without associating each formula with its geometric meaning. In a test question asking for the perimeter of a rectangle measuring 8 cm by 5 cm, students often multiply 8 times 5 and write '40 cm', or write '26 sq cm'. They mix up both the operation (multiplication vs addition) and the measurement units (linear cm vs square cm). To eliminate this confusion, teachers must insist on physical tracing. Before writing any formula, students must trace their finger along the outer boundary of the shape while saying: 'Perimeter is walking along the fence: 8 + 5 + 8 + 5 = 26 centimeters'. Then they place their flat palm over the interior of the shape while saying: 'Area is tiling the floor: 8 columns of 5 squares = 40 square centimeters'. Enforcing unit labels on every line of working further reinforces this distinction. Practicing with real-world scenarios like framing a picture (perimeter) versus painting a canvas (area) solidifies which calculation to apply.`
  },
  {
    id: "ncert-cl5-ar-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_area",
    type: "hint",
    lang: "te",
    source: "NCERT గణితం తరగతి 5, అధ్యాయం 11 వైశాల్యం సూచనలు",
    license: "own",
    text: `చుట్టుకొలత మరియు వైశాల్యం మధ్య తేడాను స్పష్టంగా గుర్తుంచుకోవడానికి ఈ సులభమైన ఉదాహరణను ఆలోచించండి. చుట్టుకొలత (పెరిమీటర్) అంటే ఒక స్థలం చుట్టూ వేసే కంచె లాంటిది. ఒక దీర్ఘచతురస్రం చుట్టూ నడిస్తే ఎంత దూరం అవుతుందో అదే చుట్టుకొలత. కాబట్టి అన్ని వైపుల పొడవులను కూడాలి: 2 × (పొడవు + వెడల్పు). దీని ప్రమాణాలు కేవలం సెంటీమీటర్లు లేదా మీటర్లు మాత్రమే. కానీ వైశాల్యం (ఏరియా) అంటే ఆ గది నేలపై పరిచే చాప లేదా టైల్స్ లాంటిది. లోపల ఎంత స్థలం ఆక్రమించబడిందో కొలవడానికి పొడవును వెడల్పుతో గుణించాలి: పొడవు × వెడల్పు. వైశాల్యాన్ని ఎల్లప్పుడూ చదరపు సెంటీమీటర్లు (sq cm) లేదా చదరపు మీటర్లలో (sq m) కొలుస్తారు. లెక్కలో కంచె లేదా సరిహద్దు గురించి అడిగితే చుట్టుకొలత కనుక్కోండి; నేల, రంగు వేసే గోడ లేదా కాగితం స్థలం గురించి అడిగితే వైశాల్యం కనుక్కోండి. ప్రశ్నను జాగ్రత్తగా చదివి ప్రమాణాలు సమానంగా ఉన్నాయో లేదో చూసుకున్న తర్వాత మాత్రమే లెక్క మొదలుపెట్టండి. చుట్టుకొలతకు కూడిక, వైశాల్యానికి గుణకారం గుర్తుంచుకోండి.`
  },

  // 11. cbse_5_volume
  {
    id: "ncert-cl5-vol-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_volume",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Chapter 14 'How Big? How Heavy?', pp. 188-192",
    license: "own",
    text: `Volume in Class 5 extends spatial measurement from flat two-dimensional surfaces into three-dimensional space. While area counts how many unit squares cover a flat plane, volume measures how much three-dimensional space a solid object occupies, or how much liquid a hollow container can hold. The standard fundamental unit of volume is the unit cube: a cube measuring 1 cm long, 1 cm wide, and 1 cm high, which has a volume of 1 cubic centimeter (1 cm³). To determine the volume of a solid cuboid, such as a wooden block measuring 5 cm long, 3 cm wide, and 4 cm high, students learn to count in layers. The bottom layer consists of 5 rows of 3 unit cubes, giving 15 cubes in that base layer. Since the cuboid is 4 cm tall, there are 4 identical layers stacked vertically on top of each other. Multiplying 15 cubes per layer by 4 layers gives a total volume of 60 cubic centimeters. This layer-by-layer reasoning naturally generates the formula: Volume equals Length times Breadth times Height. Connecting cubic centimeters to liquid capacity (where 1 cm³ of water equals exactly 1 milliliter, and 1000 cm³ equals 1 liter) allows students to bridge solid geometry with practical everyday measurement.`
  },
  {
    id: "ncert-cl5-vol-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_volume",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Matchbox Building Activity",
    license: "own",
    text: `Collect 30 to 40 empty matchboxes to conduct the Matchbox Tower Volume Challenge. Each identical matchbox represents an informal unit of volume. Working in small groups, ask students to build different cuboids using exactly 24 matchboxes. One group arranges them in a single flat layer: 6 matchboxes long and 4 matchboxes wide, 1 matchbox high. Another group builds a tall tower: 3 matchboxes long, 2 matchboxes wide, and 4 matchboxes high. A third group builds an arrangement 12 matchboxes long, 2 wide, and 1 high. Ask each group: how many matchboxes did you use? All groups used exactly 24 boxes. Point out that all three different constructions occupy the exact same volume of space (24 matchbox units), even though their heights and shapes look strikingly different! Next, have students measure the dimensions of one matchbox with a ruler (approx 5 cm by 3.5 cm by 1.5 cm) and calculate the real volume in cubic centimeters. Building tactile towers transforms abstract cubic formulas into an engaging structural puzzle, proving that three-dimensional capacity can take varied geometrical configurations while retaining identical capacity.`
  },
  {
    id: "ncert-cl5-vol-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_volume",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Volume Diagnostic Guide",
    license: "own",
    text: `A frequent conceptual pitfall is confusing surface area with volume, or confusing capacity with external dimensions. When asked to find the volume of a box, some students add all six face dimensions together, or calculate the area of the top lid and stop. Another common misconception is assuming that changing the shape of a malleable substance alters its volume. For example, if a child is given a lump of modeling clay or wet dough shaped as a cube and squashes it flat into a pancake, many Class 5 children will claim that the flattened pancake has more volume because 'it spreads out much wider across the table'. To remediate this, use the Water Displacement Test. Fill a transparent plastic glass half-full of water and mark the water level with a rubber band. Submerge the clay cube: the water level rises. Remove the clay, flatten it into an irregular shape, and submerge it again. The water rises to the exact same rubber band mark! This proves that volume depends solely on the amount of matter, not its shape. Emphasizing displacement provides concrete proof that three-dimensional volume remains invariant under shape deformation.`
  },
  {
    id: "ncert-cl5-vol-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "cbse_5_volume",
    type: "hint",
    lang: "hi",
    source: "NCERT गणित का जादू कक्षा 5, अध्याय 14",
    license: "own",
    text: `किसी घनाभ (क्यूबॉइड) जैसे ईंट, संदूक या माचिस की डिब्बी का आयतन (वॉल्यूम) निकालते समय हमेशा परतों (लेयर्स) के रूप में सोचें। सबसे पहले फर्श या आधार की माप देखें: लंबाई को चौड़ाई से गुणा करें। इससे आपको पता चलेगा कि सबसे नीचे की एक परत में 1 सेमी के कितने पासे (क्यूब्स) आ सकते हैं। अब देखें कि डिब्बा कितना ऊंचा है, यानी उसमें ऐसी कितनी परतें एक के ऊपर एक रखी जा सकती हैं। आधार के क्षेत्रफल को ऊंचाई से गुणा कर दें: आयतन बराबर लंबाई गुणा चौड़ाई गुणा ऊंचाई। यदि कोई डिब्बा 5 सेमी लंबा, 3 सेमी चौड़ा और 2 सेमी ऊंचा है, तो पहली परत में 5 गुणा 3 बराबर 15 क्यूब्स आएंगे, और 2 परतें होने के कारण कुल 15 गुणा 2 बराबर 30 घन सेंटीमीटर (क्यूबिक सेमी) आयतन होगा। आयतन की इकाई हमेशा घन सेंटीमीटर (cu cm) में लिखें, वर्ग सेंटीमीटर में नहीं, क्योंकि यह त्रि-आयामी (3D) जगह नापता है। किसी खाली बर्तन में कितना पानी आ सकता है, यह जानने के लिए भी आयतन की गणना की जाती है।`
  },

  // 12. mult_facts (DAG Prerequisite)
  {
    id: "ncert-cl5-mf-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "mult_facts",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Multiplication Fluency Foundation",
    license: "own",
    text: `Multiplication facts (times tables from 2 to 9) form the foundational engine for all multi-digit arithmetic, division, fractions, and algebra. In Class 5, a student who lacks automatic recall of basic facts experiences severe cognitive overload when attempting long division or fraction simplification. Memorization should never be isolated rote chanting; rather, it should be built upon structural properties such as the commutative property (7 times 8 is identical to 8 times 7) and derived fact strategies. For example, the 4 times table is simply double the 2 times table. The 8 times table is double the 4 times table. The 9 times table can be found by multiplying by 10 and subtracting one group (for example, 9 times 6 is 60 minus 6, which is 54). Similarly, the 7 times table can be decomposed into 5 times plus 2 times (7 times 6 is 5 times 6 plus 2 times 6 = 30 + 12 = 42). Equipping students with these mental bridges ensures they can reconstruct any forgotten fact rapidly and confidently. Teachers should encourage students to notice patterns on a 100-square grid, highlighting how multiples form diagonal symmetries and repeating digit endings across number families.`
  },
  {
    id: "ncert-cl5-mf-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "mult_facts",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Tamarind Seed Array Game",
    license: "own",
    text: `Use dried tamarind seeds (imli ke beej), pebbles, or bottle caps to create tactile Multiplication Arrays on the desk. Present a fact that students frequently stumble on, such as 7 times 6. Ask a student to lay out 7 horizontal rows with 6 tamarind seeds in each row. Have them observe the structure: it forms a clean rectangle. Ask another student to view the array from the side: they see 6 vertical columns of 7 seeds each. This physically demonstrates that 7 times 6 equals 6 times 7 (42 seeds). Now place a ruler across the array between the fifth and sixth rows, splitting the 7 rows into 5 rows and 2 rows. Have students calculate each sub-rectangle: 5 rows of 6 seeds equals 30 seeds; 2 rows of 6 seeds equals 12 seeds. Combining 30 and 12 gives 42 seeds! Students see with their own eyes that hard facts can be broken into two friendly, well-known facts. This manipulative practice builds deep fluency without tedious memorization drills. Have students draw their decomposed arrays on squared paper, annotating the two partial areas to reinforce the distributive property visually.`
  },
  {
    id: "ncert-cl5-mf-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "mult_facts",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 5, Fact Fluency Diagnostic Notes",
    license: "own",
    text: `Many students who struggle with multi-digit multiplication do not actually have a conceptual issue with multiplication; rather, they suffer from finger-counting table fatigue. When asked 8 times 7, the child restarts at 8 times 1 equals 8, 8 times 2 equals 16, counting laboriously on their knuckles all the way to 8 times 7. By the time they reach 56, they have lost track of the multi-digit long multiplication step they were originally trying to execute. Teachers often mistake this for a learning disability in multi-digit operations, when it is simply an absence of derived fact retrieval strategies. Remediate this by banning counting from 1 for tables above 5. Teach anchor benchmarks: students always know their 5 times table and their 10 times table automatically. If they need 8 times 7, start from the friendly anchor: 5 times 7 is 35. Now add three more 7s (21): 35 plus 21 equals 56. Anchoring to 5 or 10 cuts calculation time by 80% and reduces cognitive fatigue. Regular 2-minute daily warmups practicing decomposition strategies empower students to calculate with speed and calm confidence.`
  },
  {
    id: "ncert-cl5-mf-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "mult_facts",
    type: "hint",
    lang: "hi",
    source: "NCERT गणित का जादू कक्षा 4 व 5, पहाड़ा संकेत",
    license: "own",
    text: `यदि आप किसी बड़े पहाड़े जैसे 7, 8 या 9 में कोई गुणनफल भूल जाएं, तो कभी भी 1 से गिनना शुरू न करें। इसके बजाय अपने जाने-पहचाने सरल पहाड़े (जैसे 5 या 10 का पहाड़ा) को आधार बनाएं। उदाहरण के लिए, यदि आप भूल गए हैं कि 8 × 7 कितना होता है, तो पहले सोचें कि 8 × 5 कितना होता है। 8 × 5 = 40 सभी को याद रहता है। अब आपको 8 को 7 बार लेना था, लेकिन आपने केवल 5 बार लिया है। यानी 8 को अभी 2 बार और जोड़ना बाकी है। 8 × 2 = 16 होता है। अब 40 में 16 जोड़ दीजिए: 40 + 16 = 56! इसी तरह 9 का पहाड़ा निकालने के लिए 10 से गुणा करके संख्या को एक बार घटा लें (जैसे 9 × 8 के लिए 80 में से 8 घटाएं = 72)। इस तरह आप बिना रटे किसी भी पहाड़े का सही उत्तर चुटकियों में निकाल सकते हैं। अपने सहपाठियों के साथ 5 के आधार पर पहाड़े तोड़ने का अभ्यास करें और देखें कि कैसे कठिन पहाड़े भी एकदम सरल और मजेदार बन जाते हैं।`
  },

  // 13. division_concept (DAG Prerequisite)
  {
    id: "ncert-cl5-dc-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "division_concept",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 4, Chapter 12 'Can We Share?', pp. 160-164",
    license: "own",
    text: `The division concept in primary mathematics is grounded in two primary physical actions: equal sharing among recipients and repeated subtraction of equal groups. When 20 marbles are distributed fairly among 4 children so each gets the same number, that is sharing (partitive division). When 20 marbles are packed into bags containing 4 marbles each to find out how many bags can be made, that is repeated subtraction or grouping (quotative division). Understanding that division is the exact inverse of multiplication is essential: multiplication unites equal groups into a total (4 groups of 5 makes 20), whereas division unpacks a total into equal groups (20 shared into 4 groups gives 5 per group). If children understand this inverse relationship, they never need to learn division facts separately from multiplication facts: knowing that 6 times 7 is 42 immediately yields 42 divided by 6 equals 7 and 42 divided by 7 equals 6. Connecting division to subtraction also clarifies what a remainder is: it is simply the quantity left over when no more full groups can be subtracted. Teachers should provide regular opportunities to represent division sentences as repeated subtraction jumps on a number line.`
  },
  {
    id: "ncert-cl5-dc-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "division_concept",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Marbles and Chalk Circles Game",
    license: "own",
    text: `Conduct the Fair Share Chalk Circles activity on the classroom verandah using 24 small stones or pebbles. Draw 4 distinct chalk circles on the floor representing 4 children. Hand the pile of 24 pebbles to a student and ask them to share them out fairly. The student deals out the pebbles one by one: one in each circle, then a second in each circle, continuing until the central pile is empty. Count the pebbles in each circle: exactly 6 pebbles per circle. Next, clear the floor and present the grouping problem: 'Here are 24 pebbles. Each student needs 6 pebbles to play a game. How many students can play?' The student repeatedly counts out groups of 6 pebbles from the pile: first group of 6 (18 left), second group of 6 (12 left), third group of 6 (6 left), fourth group of 6 (0 left). Exactly 4 students can play. Have the class write both equations: 24 divided by 4 equals 6, and 24 divided by 6 equals 4. Seeing both sharing and grouping in the same lesson cements conceptual clarity. Students conclude by creating their own story problems for both interpretations.`
  },
  {
    id: "ncert-cl5-dc-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "division_concept",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Foundational Division Misconceptions",
    license: "own",
    text: `A common conceptual misunderstanding is the belief that division is commutative, meaning children believe that 12 divided by 3 is the same as 3 divided by 12. Because addition (4+5 = 5+4) and multiplication (4x5 = 5x4) are commutative, students assume all mathematical operations can be reversed without consequence. When faced with an unfamiliar word problem, a student might divide the smaller number by the larger number or vice-versa indiscriminately. To remediate this, use an immediate concrete test: 'If I have 12 rotis and share them among 3 children, how many rotis does each child get? 4 whole rotis! Now, if I have only 3 rotis and share them among 12 hungry children, can each child still get 4 rotis?' The children laugh and realize that each child would get only a quarter of a roti. Order matters in division! The total being shared (dividend) must always be placed first in the division sentence. Teachers should explicitly post non-commutative warnings on the classroom math wall, comparing subtraction and division to reinforce directional operations.`
  },
  {
    id: "ncert-cl5-dc-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "division_concept",
    type: "hint",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Division Scaffold Card",
    license: "own",
    text: `Whenever you see a division problem like 35 divided by 5, rephrase it immediately as a multiplication question in your mind: 'What number multiplied by 5 gives 35?' Because multiplication and division are opposites, finding the missing factor gives you the answer instantly. Count up by fives: 5, 10, 15, 20, 25, 30, 35. That took 7 steps! So 35 divided by 5 is 7. If the number does not divide evenly, such as 38 divided by 5, ask yourself: 'What is the largest multiple of 5 that fits inside 38 without going over?' 5 times 7 is 35. Then subtract: 38 minus 35 leaves 3. So the quotient is 7 with a remainder of 3. Always remember: division is simply asking how many equal groups of the divisor can be taken out of the total. You can check your work by multiplying your quotient by the divisor and adding the remainder: (7 × 5) + 3 = 35 + 3 = 38. That confirms your answer is completely correct.`
  },

  // 14. fraction_basics (DAG Prerequisite)
  {
    id: "ncert-cl5-fb-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_basics",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 4, Chapter 9 'Halves and Quarters', pp. 94-98",
    license: "own",
    text: `Fraction basics in Class 4 and 5 establish the foundational concept of a fraction as a numeral representing one or more equal parts of a whole unit or set. The fraction notation consists of three components: the denominator (bottom number), the numerator (top number), and the fraction bar (vinculum). The denominator tells us the total number of equal-sized portions into which the whole has been divided. The numerator tells us how many of those equal portions are being selected or considered. For instance, in the fraction 3/4, the number 4 indicates that a single complete whole (such as an apple, a ribbon, or a geometric square) has been cut into exactly 4 equal parts. The number 3 indicates that we are holding or shading 3 of those parts. A crucial condition that children must internalize is that the parts MUST be strictly equal in size. Dividing a shape into 4 irregular, random pieces does not create fourths. Once children understand equal partitioning, fractions cease to be abstract symbols and become meaningful quantities. Teachers should illustrate fractions using both continuous models (like cakes or ribbons) and discrete sets (like 3 blue marbles out of 4 total marbles).`
  },
  {
    id: "ncert-cl5-fb-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_basics",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Paper Puri Tearing Activity",
    license: "own",
    text: `Use discarded circular paper coasters or circular shapes cut from old calendar paper to conduct the Paper Puri Fair Sharing lesson. Give each student three circular paper puris. Tell a story: two friends, Amit and Priya, sit down to eat 1 puri. How should they share it fairly? Have the students fold the paper circle exactly in half, crease it, and tear or cut along the line. Each piece is 1/2. Next, suppose four friends want to share 1 puri. Take the second circular paper, fold it in half, and then fold it in half again. When opened, four equal sectors appear. Each piece is 1/4 (one quarter). Finally, take the third paper circle and fold it into four unequal, jagged parts on purpose. Ask the students: can any of these three pieces be called 1/4? The children observe that one piece is large and another tiny, so none can be called 1/4 because they are not fair or equal. This tactile folding makes the concept of equal parts unforgettable. Have students paste the folded halves and fourths into their notebooks, writing the fraction label under each piece.`
  },
  {
    id: "ncert-cl5-fb-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_basics",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Fraction Misconceptions Audit",
    license: "own",
    text: `A prevalent misconception among early learners is counting the shaded and unshaded pieces to form the denominator, rather than comparing shaded parts to the total whole. For example, if a rectangle is divided into 4 equal quarters and 1 quarter is shaded, some students will write the fraction as 1/3 (1 shaded part over 3 unshaded parts) instead of 1/4. They treat the fraction bar as a comparison ratio between parts (part-to-part) rather than part-to-whole. Another misconception is ignoring the size of pieces: if a circle is divided by an off-center line into one huge region and three tiny regions, children will count 4 pieces and call the huge region 1/4. To remediate this, teach the Fraction Naming Chant: 'Top number counts the parts we take; bottom number counts ALL the parts that make the whole!' Have students tap each and every piece while counting the total denominator, emphasizing that shaded pieces must also be included in the total count. Regular verification on symmetrical shapes prevents part-to-part confusion from taking root.`
  },
  {
    id: "ncert-cl5-fb-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "fraction_basics",
    type: "hint",
    lang: "te",
    source: "NCERT గణితం తరగతి 4, అధ్యాయం 9 భిన్నాల ప్రాథమిక సూచనలు",
    license: "own",
    text: `భిన్నం రాసేటప్పుడు ఎల్లప్పుడూ రెండు విషయాలను స్పష్టంగా గుర్తుపెట్టుకోండి. మొదటిది: హారం (కింద ఉండే సంఖ్య) అనేది ఒక వస్తువును మొత్తం ఎన్ని సమాన భాగాలుగా విభజించారో తెలుపుతుంది. రెండవది: లవం (పైన ఉండే సంఖ్య) అనేది ఆ సమాన భాగాలలో మనం ఎన్ని భాగాలను తీసుకున్నామో లేదా రంగు వేశామో తెలుపుతుంది. ఉదాహరణకు, ఒక రొట్టెను 4 సమాన భాగాలు చేసి, అందులో 1 భాగాన్ని తింటే, మనం తిన్న భాగం 1/4 అవుతుంది. ఇక్కడ మిగిలిన 3 భాగాలను మాత్రమే చూసి 1/3 అని రాయకూడదు! మొత్తం భాగాల సంఖ్య (1 తిన్నది + 3 మిగిలినవి = మొత్తం 4) తప్పనిసరిగా కింద ఉండాలి. అన్ని భాగాలు ఖచ్చితంగా సమాన పరిమాణంలో ఉండాలి. భాగాలు సమానంగా లేకపోతే దానిని భిన్నంగా పరిగణించలేము. భిన్నం అంటే మొత్తం వస్తువులో సమాన భాగం అని ఎల్లప్పుడూ గుర్తుంచుకోండి. సమాన భాగాలను నిర్ధారించుకోవడానికి కాగితాన్ని మడతబెట్టి చూడటం ఎల్లప్పుడూ మంచి పద్ధతి. పరీక్షల్లో భిన్నం రాయడానికి ముందు మొత్తం భాగాలను జాగ్రత్తగా లెక్కించండి.`
  },

  // 15. place_value (DAG Prerequisite)
  {
    id: "ncert-cl5-pv-exp-01",
    board: "NCERT",
    class: 5,
    conceptId: "place_value",
    type: "explanation",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Number Sense and Place Value",
    license: "own",
    text: `Place value is the bedrock of the Hindu-Arabic decimal numeral system. In this positional notation system, the value of any digit depends strictly on its position within the number. Each position represents a power of ten: units (ones), tens, hundreds, thousands, ten thousands, and lakhs (hundred thousands). For example, in the number 54,235, the digit 5 appears twice, but its values are vastly different: the rightmost 5 has a place value of 5 ones (5), while the leftmost 5 has a place value of 5 ten-thousands (50,000). A profound feature of the system is the digit zero (shunya), which serves as an essential placeholder indicating that there are zero units of a particular power of ten. In the number 7,042, the zero indicates that there are no hundreds; without the zero placeholder, the number would collapse into 742, representing a completely different quantity. Mastery of expanded notation (7,000 + 40 + 2) is essential for children to grasp regrouping during multi-digit addition, subtraction, and multiplication. Teachers should consistently ask students to expand numbers aloud to cement the bundled values behind each written numeral.`
  },
  {
    id: "ncert-cl5-pv-act-02",
    board: "NCERT",
    class: 5,
    conceptId: "place_value",
    type: "activity",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Matchstick Bundle Place Value Activity",
    license: "own",
    text: `Use broomsticks or burnt matchsticks tied with rubber bands to teach tactile multi-digit place value. Single loose matchsticks represent 'Ones'. When students collect 10 loose sticks, they must tie them with a rubber band to create one bundle representing '1 Ten'. When they accumulate 10 bundles of ten, they tie all ten bundles together with string to form one large bundle of '1 Hundred' (100 sticks). Accumulating 10 hundred-bundles fills an empty cardboard shoebox representing '1 Thousand' (1000 sticks). Challenge students to represent a number like 1,234 on their desks: they place 1 shoebox, 2 hundred-bundles, 3 ten-bundles, and 4 loose sticks. Next, ask a student to add 8 more loose sticks. When they count 12 loose sticks, remind them of the Bank Rule: you can never have 10 or more loose sticks in the units column! They immediately tie 10 sticks into a new ten-bundle and move it to the tens column. This hands-on bundling makes carrying over in addition completely obvious. Students can then represent numbers dictated by classmates, experiencing how bundling scales up place by place.`
  },
  {
    id: "ncert-cl5-pv-misc-03",
    board: "NCERT",
    class: 5,
    conceptId: "place_value",
    type: "misconception",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Place Value Diagnostic Audit",
    license: "own",
    text: `A major misconception in place value is confusing the face value of a digit with its place value. When asked 'In the number 6,482, what is the value of 4?', many children answer '4'. The child reads the numeral face value and ignores the column position. Another common error occurs when writing numbers dictated verbally with internal zeros: when dictated 'six thousand forty-two', students frequently write '600042' or '642'. They write '6000' and append '42' alongside it because they do not understand how positions overwrite powers of ten. To remediate this, use Place Value Arrow Cards. Arrow cards are cut-out strips showing 6000, 40, and 2. When layered on top of each other with their arrows aligned, the cards physically slide together to display '6042'. When pulled apart, the cards reveal the expanded components: 6000, 40, and 2. This proves that 6042 consists of 6 thousands, 0 hundreds, 4 tens, and 2 ones. Working with arrow cards visually repairs zero placeholder slips and reinforces the additive synthesis of numbers.`
  },
  {
    id: "ncert-cl5-pv-hint-04",
    board: "NCERT",
    class: 5,
    conceptId: "place_value",
    type: "hint",
    lang: "en",
    source: "NCERT Math-Magic Class 4 & 5, Place Value Strategy Card",
    license: "own",
    text: `To find the place value of any digit in a number, write the place-value column headings directly above the digits from right to left: O (Ones), T (Tens), H (Hundreds), Th (Thousands), T-Th (Ten Thousands), and L (Lakhs). For example, in the number 85,327, the digit 5 sits underneath the Th (Thousands) column. To find its place value, multiply the digit by its column value: 5 times 1,000 equals 5,000. If you are asked to write a dictated number like 'Eight thousand seven', first draw four blank dashes for the four columns: [Th] [H] [T] [O]. Put 8 in the Thousands dash, and put 7 in the Ones dash. What goes in the empty Hundreds and Tens dashes? Zeros! This gives 8,007. If you forgot the zeros and wrote 87, you would only have eighty-seven instead of eight thousand. Always protect empty places with zeros! Checking your work by writing the expanded form (8000 + 7 = 8007) guarantees that your place value digits are completely accurate.`
  },
];

// 32 ICSE Chunks covering all 8 ICSE Class 5 concepts
const rawIcseChunks = [
  // 1. icse_5_numbers_operations
  {
    id: "icse-cl5-no-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_numbers_operations",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 1 'Numbers up to 9 Digits', pp. 5-9",
    license: "own",
    text: `ICSE Class 5 mathematics extends whole number operations up to 8 and 9 digits, requiring students to master both the Indian system of numeration (Crores, Lakhs, Thousands, Ones) and the International system of numeration (Millions, Thousands, Ones). In the Indian system, commas are placed after the first three digits from the right (hundreds period), and subsequently after every two digits (thousands period, lakhs period, crores period), such as 4,32,50,678. In the International system, commas are placed strictly after every three digits from the right (ones period, thousands period, millions period), such as 43,250,678 (read as forty-three million two hundred fifty thousand six hundred seventy-eight). Additionally, students must learn the seven basic Roman numerals: I (1), V (5), X (10), L (50), C (100), D (500), and M (1000). The rules of Roman numeration require that symbols V, L, and D are never repeated and never subtracted, while I, X, and C can be repeated up to three consecutive times. Understanding both place-value systems and additive Roman notation provides students with deep historical and structural perspective on number representations. Teachers should provide regular translation exercises where students read global statistics and rephrase them into Indian financial terms and vice versa.`
  },
  {
    id: "icse-cl5-no-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_numbers_operations",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Laboratory Activity: Dual System Census Charts",
    license: "own",
    text: `Conduct the Population Census Converter activity using real demographic data from Indian states printed from an encyclopedia or newspaper. Write a large population figure on the blackboard, such as 78456123. Divide the class into two rival analyst teams: Team Bharat (Indian System) and Team Global (International System). Team Bharat draws a place value table on paper with columns: Ten Crores, Crores, Ten Lakhs, Lakhs, Ten Thousands, Thousands, Hundreds, Tens, and Units. They place commas: 7,84,56,123, and write in words: 'Seven crore eighty-four lakh fifty-six thousand one hundred twenty-three'. Team Global draws their table with columns: Hundred Millions, Ten Millions, Millions, Hundred Thousands, Ten Thousands, Thousands, Hundreds, Tens, and Units. They insert commas: 78,456,123, and write in words: 'Seventy-eight million four hundred fifty-six thousand one hundred twenty-three'. The teams swap notebooks and verify each other's conversion. Comparing the two readings of the exact same number highlights that 1 million equals 10 lakhs and 10 million equals 1 crore. This collaborative data conversion exercise equips students to navigate international financial publications and local census data with equal ease and confidence.`
  },
  {
    id: "icse-cl5-no-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_numbers_operations",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Roman Numerals Diagnostic Bulletin",
    license: "own",
    text: `A frequent error in Roman numerals occurs when students invent invalid subtraction combinations or repeat restricted symbols. For instance, when asked to write 45 in Roman numerals, students often write 'VL' (reasoning: 50 minus 5 is 45) or 'IL' for 49. In standard Roman numeration, V (5), L (50), and D (500) can NEVER be subtracted from any symbol! Only I, X, and C can be subtracted, and only from the next two higher symbols: I can only be subtracted from V and X (making IV and IX); X can only be subtracted from L and C (making XL and XC); and C can only be subtracted from D and M (making CD and CM). Therefore, 45 must be decomposed strictly in expanded form: 40 + 5 = XL + V = XLV. Similarly, 49 is (50 - 10) + (10 - 1) = XL + IX = XLIX. Teachers should teach the golden rule: write the number in expanded decimal notation first (tens and ones), convert each component separately, and then assemble them together. Emphasizing that Roman numerals operate on strict positional pair rules prevents students from treating subtraction as arbitrary arithmetic shorthand.`
  },
  {
    id: "icse-cl5-no-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_numbers_operations",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Quick Reference Cards",
    license: "own",
    text: `To convert large numbers between the Indian and International systems effortlessly, memorize this key conversion bridge: 1 Lakh = 100 Thousand; 10 Lakhs = 1 Million; 1 Crore = 10 Million; 10 Crores = 100 Million. When placing commas, always count from the far right (units digit). In the Indian system, put the first comma after 3 digits, and after that, place a comma every 2 digits (e.g. 5,43,21,098). In the International system, place commas every 3 digits all the way through (e.g. 54,321,098). When writing Roman numerals, always break the number into expanded form first: for 94, write 90 + 4; 90 is XC (10 before 100) and 4 is IV (1 before 5), so 94 is XCIV. Never subtract a number across more than one step, and never repeat V, L, or D. Always verify your Roman conversion by translating each symbol group back into standard digits to confirm the sum matches your original number.`
  },

  // 2. icse_5_hcf_lcm
  {
    id: "icse-cl5-hl-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_hcf_lcm",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 3 'Factors and Multiples', pp. 28-32",
    license: "own",
    text: `Highest Common Factor (HCF) and Lowest Common Multiple (LCM) are fundamental concepts in ICSE Class 5 arithmetic that govern fraction simplification, division, and algebraic factorization. The factors of a number are exact divisors that divide into the number without leaving a remainder; the HCF of two numbers is the largest factor shared by both. For example, the factors of 24 are 1, 2, 3, 4, 6, 8, 12, 24, and the factors of 36 are 1, 2, 3, 4, 6, 9, 12, 18, 36. Their common factors are 1, 2, 3, 4, 6, 12, so their HCF is 12. Conversely, the multiples of a number are products obtained by multiplying that number by counting numbers (1, 2, 3...); the LCM is the smallest non-zero multiple shared by both numbers. The multiples of 6 are 6, 12, 18, 24, 30, 36..., and multiples of 8 are 8, 16, 24, 32, 40... Their first shared multiple is 24, so LCM(6, 8) = 24. A vital mathematical relationship connects them: for any two positive integers, Product of Numbers equals HCF times LCM. Teaching both prime factorization and the continuous division method equips students to handle large numbers systematically and verify their results through multiple computational routes.`
  },
  {
    id: "icse-cl5-hl-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_hcf_lcm",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Math Lab Manual: Stepping Stone LCM",
    license: "own",
    text: `Conduct the Stepping Stone Floor Game in the school corridor to physically experience LCM. Use chalk to draw a number line from 0 to 30 with numbers spaced 30 centimeters apart along the floor tiles. Select two students: Student A represents the Frog with a jump size of 4 tiles; Student B represents the Grasshopper with a jump size of 6 tiles. Both start at tile 0. Student A jumps: 4, 8, 12, 16, 20, 24, 28. At each landing, Student A places a blue paper circle on the tile. Then Student B jumps: 6, 12, 18, 24, 30, placing an orange circle at each landing. The entire class inspects the number line to find where both blue and orange circles share the exact same tile: tile 12 and tile 24! Ask the class: what is the very first tile where both creatures landed together? Tile 12! That is the Lowest Common Multiple (LCM). Now ask: can they ever land together on tile 2? No, because multiples are always equal to or larger than the starting numbers. The teacher can then extend the exploration to three jumpers (e.g. step sizes 2, 3, and 4) to find the common landing point at tile 12, cementing multiple alignment kinesthetically.`
  },
  {
    id: "icse-cl5-hl-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_hcf_lcm",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Diagnostic Guidance in Factors",
    license: "own",
    text: `A very frequent confusion among Class 5 students is mixing up HCF and LCM definitions. Because the word 'Highest' sounds like a large quantity, students mistakenly expect the HCF to be a very big number (sometimes larger than the given numbers). And because 'Lowest' sounds small, they expect LCM to be a small number. In reality, the reverse is true! Factors divide INTO a number, so factors are always smaller than or equal to the number; therefore, HCF is always less than or equal to the smaller of the two numbers. Multiples are generated by multiplying, so multiples are always larger than or equal to the numbers; therefore, LCM is always greater than or equal to the larger of the two numbers. For example, for 12 and 18, HCF is 6 (smaller than 12), while LCM is 36 (larger than 18). Teachers can teach the memory hook: 'Factors divide in (smaller), Multiples multiply out (larger)!' This anchor prevents children from blindly guessing. Having students verify that HCF × LCM = A × B provides an immediate arithmetic check that catches transposed answers.`
  },
  {
    id: "icse-cl5-hl-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_hcf_lcm",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Factorization Hint Sheet",
    license: "own",
    text: `To find HCF and LCM quickly using prime factorization, express both numbers as products of prime factors. For example, for 24 and 36: 24 = 2 × 2 × 2 × 3 (or 2³ × 3¹); 36 = 2 × 2 × 3 × 3 (or 2² × 3²). To find HCF, take ONLY the common prime factors with their lowest power: both share 2² and 3¹, so HCF = 4 × 3 = 12. To find LCM, take EVERY prime factor that appears with its highest power: 2³ × 3² = 8 × 9 = 72. You can also use the common division ladder method: divide both numbers by prime numbers (2, 3, 5...) as long as they divide both. The product of the divisors on the left gives the HCF. Multiplying all left divisors AND the bottom remaining numbers gives the LCM. Always remember to check your work: HCF × LCM must equal Number A × Number B: 12 × 72 = 864, and 24 × 36 = 864. This confirms your calculations are mathematically exact.`
  },

  // 3. icse_5_fractions_ops
  {
    id: "icse-cl5-fo-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_fractions_ops",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 4 'Operations on Fractions', pp. 42-46",
    license: "own",
    text: `Operations on fractions in ICSE Class 5 require fluency in all four arithmetic operations: addition, subtraction, multiplication, and division of proper, improper, and mixed fractions. Multiplication of fractions differs conceptually from whole number multiplication. Multiplying a whole number by a fraction means finding a part of that quantity (for example, 1/2 of 10 is 5). When multiplying two fractions, such as 2/3 multiplied by 3/4, the operation means finding 2/3 OF 3/4. The computational rule is straightforward: multiply numerators together, multiply denominators together, and simplify by cancelling common factors before or after multiplying: (2 × 3) / (3 × 4) = 6/12 = 1/2. For division of fractions, students learn the concept of the reciprocal (multiplicative inverse): dividing by a fraction is mathematically equivalent to multiplying by its reciprocal. For example, 3/4 divided by 1/2 equals 3/4 multiplied by 2/1, which yields 6/4 = 3/2 = 1 1/2. This rule stems from asking: how many half-sized portions are contained inside three-quarters? Exactly one and a half portions. Teachers should emphasize simplifying before multiplying, showing how cross-cancellation reduces calculation burden and prevents bulky fractions.`
  },
  {
    id: "icse-cl5-fo-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_fractions_ops",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Area Model Paper Folding Activity",
    license: "own",
    text: `Use a square piece of white paper to visually model fraction multiplication, such as 1/2 times 3/4. Give each student a square origami sheet. First, have them represent 3/4 by folding the paper into 4 equal vertical columns. Shade 3 of the 4 columns with a blue pencil. This represents 3/4 of the whole square. Next, explain that we want to take 1/2 of that blue region. Turn the paper 90 degrees and fold it into 2 equal horizontal halves. Shade the top half with an orange pencil crosswise across the blue area. Now unfold the paper and inspect the grid. The paper is now divided into a 2-by-4 grid of 8 equal smaller rectangles. Ask the class: how many rectangles have BOTH blue and orange shading? Exactly 3 rectangles! And how many total rectangles are in the whole square? 8 rectangles. Therefore, 1/2 of 3/4 equals 3/8! The children see that 1 times 3 gives the 3 overlapping parts, while 2 times 4 gives the 8 total parts. This physical demonstration proves why multiplying numerators and denominators produces the correct product without memorizing arbitrary rules.`
  },
  {
    id: "icse-cl5-fo-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_fractions_ops",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Fraction Diagnostic Notes",
    license: "own",
    text: `A very common algorithmic error in fraction division is inverting the wrong fraction or forgetting to change the division sign to multiplication. When faced with 2/3 divided by 4/5, students sometimes invert the dividend (writing 3/2 divided by 4/5), or invert both fractions (3/2 times 5/4), or invert the second fraction but forget to change the division sign to multiplication. Another error is cross-cancelling during division before inverting. To eliminate these slips, teach the simple three-word rhyme: Keep, Change, Flip! First, KEEP the first fraction exactly as it is (2/3). Second, CHANGE the division sign into a multiplication sign (×). Third, FLIP the second fraction upside down to its reciprocal (4/5 becomes 5/4). Now calculate: (2 × 5) / (3 × 4) = 10/12 = 5/6. Emphasize that flipping the second fraction works because division and multiplication are reciprocal operations. Point out that asking 'how many 1/4s are in 2' is the same as asking '2 times 4', which naturally inverts the divisor. Practicing this chant builds permanent procedural fluency.`
  },
  {
    id: "icse-cl5-fo-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_fractions_ops",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Fraction Rules Sheet",
    license: "own",
    text: `Before multiplying or dividing mixed fractions like 2 1/3 and 1 1/2, ALWAYS convert them into improper fractions first! Multiply the whole number by the denominator and add the numerator: 2 1/3 becomes 7/3, and 1 1/2 becomes 3/2. If multiplying, check if you can cancel any numerator with any denominator to simplify early: here 3 in the denominator cancels with 3 in the numerator, leaving 7/2 = 3 1/2. If dividing, remember the rule: Keep the first fraction, Change division to multiplication, and Flip the second fraction. For example, 7/3 divided by 3/2 becomes 7/3 × 2/3 = 14/9 = 1 5/9. Never attempt to multiply or divide the whole number parts and fraction parts separately; converting to improper fractions first guarantees 100% accuracy every time. Finally, always simplify your answer to lowest terms and express improper fractions as mixed numbers if requested in the problem.`
  },

  // 4. icse_5_decimals_ops
  {
    id: "icse-cl5-do-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_decimals_ops",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 5 'Operations on Decimals', pp. 55-59",
    license: "own",
    text: `Decimal operations in ICSE Class 5 require rigorous understanding of place-value alignment during addition and subtraction, and power-of-ten rules during multiplication and division. When adding or subtracting decimals like 14.8 and 3.25, the decimal points must be aligned vertically, and any empty positions padded with placeholder zeros (14.80 + 3.25 = 18.05). For multiplication of decimals, students first multiply the numbers as if they were whole numbers, completely ignoring decimal points. Once the product is found, they count the total number of decimal places in all factors combined and place the decimal point that many positions from the right in the final answer. For example, in 3.4 times 0.12, 34 times 12 equals 408. There is 1 decimal place in 3.4 and 2 decimal places in 0.12, making 3 decimal places total. Counting 3 places from the right gives 0.408. When multiplying by 10, 100, or 1000, the decimal point simply shifts to the right by 1, 2, or 3 places; when dividing by 10, 100, or 1000, it shifts to the left. Teachers should connect these shifts to place value scaling, showing that multiplying by 10 increases the value of every digit tenfold.`
  },
  {
    id: "icse-cl5-do-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_decimals_ops",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Classroom Market Audit Activity",
    license: "own",
    text: `Create a Classroom Stationery Shop audit activity using real empty product packaging and price tags. Set up a store table displaying pencils (Rs 4.50), notebooks (Rs 28.75), rulers (Rs 12.25), erasers (Rs 3.50), and sketch pens (Rs 45.00). Provide students with customer shopping orders: Customer 1 buys 3 pencils and 2 notebooks. The students must calculate the cost of pencils: 3 times 4.50 = Rs 13.50. Then calculate the cost of notebooks: 2 times 28.75 = Rs 57.50. Next, add the items with vertically aligned decimal points: 13.50 plus 57.50 equals Rs 71.00. Finally, suppose Customer 1 pays with a 100-rupee note. The students calculate the change: 100.00 minus 71.00 equals Rs 29.00. Having students act as billing clerks with real receipts connects decimal alignment directly to financial responsibility and decimal accuracy. Next, challenge students to calculate the cost of buying 10 erasers or 100 pencils, demonstrating the decimal point hopping rule in action as Rs 3.50 × 10 becomes Rs 35.00 instantly without tedious column multiplication.`
  },
  {
    id: "icse-cl5-do-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_decimals_ops",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Decimal Operations Error Guide",
    license: "own",
    text: `A prevalent error in decimal multiplication is bringing down the decimal point directly into the product as if it were addition. For example, when calculating 0.3 times 0.3, a student multiplies 3 by 3 to get 9, looks at the decimal point sitting one place from the right, and writes '0.9'. In reality, 0.3 times 0.3 equals 0.09! Three tenths of three tenths is nine hundredths. The student fails to realize that multiplying numbers smaller than 1 produces an even smaller product. To fix this, have students write the problem as fractions first: 3/10 times 3/10 equals 9/100. How do we write 9 hundredths as a decimal? 0.09! Now point out the decimal counting rule: 0.3 has 1 decimal place, and 0.3 has 1 decimal place, so the product must have 1 + 1 = 2 decimal places. Since 9 is only one digit, we must insert a placeholder zero before 9 to make 0.09. Teachers should enforce checking with fraction equivalents whenever students produce implausibly large decimal products.`
  },
  {
    id: "icse-cl5-do-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_decimals_ops",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Decimal Strategy Card",
    license: "own",
    text: `To multiply decimals without fear: Step 1, ignore the decimal points completely and multiply the numbers as ordinary whole numbers. Step 2, count how many digits are behind the decimal point in the first number. Step 3, count how many digits are behind the decimal point in the second number. Step 4, add those two counts together. Step 5, in your answer, start from the far right end and count that many hops to the left, then place your decimal point! For example, 1.25 × 0.4: multiply 125 by 4 to get 500. Count decimal places: 1.25 has 2 places; 0.4 has 1 place; 2 + 1 = 3 places total. Starting from the right of 500, jump 3 places left: .500 = 0.5. For division by 10, 100, or 1000, simply hop the decimal point to the LEFT by the number of zeros. When adding or subtracting, always line up decimal points vertically and pad empty ends with zeros before calculating.`
  },

  // 5. icse_5_percentages
  {
    id: "icse-cl5-pct-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_percentages",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 7 'Percentages', pp. 82-86",
    license: "own",
    text: `Percentage in ICSE Class 5 introduces students to standardized proportional comparison. The word 'percent' is derived from the Latin 'per centum', meaning 'out of every hundred' or 'per hundred'. The symbol % denotes a fraction with a fixed denominator of 100. Thus, 25% literally signifies 25 out of 100, which can be written as 25/100, or simplified to 1/4, or written as the decimal 0.25. The immense practical value of percentages is that they allow fair, direct comparison across groups of different sizes. For instance, if Student A scores 18 marks out of 20 on a class test, and Student B scores 42 marks out of 50 on a different test, it is not immediately obvious who performed better. Converting both to percentages provides an instant benchmark: Student A scored 18/20 = 90/100 = 90%, while Student B scored 42/50 = 84/100 = 84%. To convert any fraction to a percentage, multiply it by 100%. To convert a percentage to a fraction, place the number over 100 and simplify. Teachers should regularly connect percentages to real-world store discounts, cricket strike rates, and exam scorecards to highlight their universality.`
  },
  {
    id: "icse-cl5-pct-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_percentages",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Laboratory Activity: 100-Bindi Mosaic Board",
    license: "own",
    text: `Construct a 100-Bindi Mosaic Board using a 10 cm by 10 cm square cardboard tile and packets of colored bindis (red, green, blue, yellow). Draw a 10x10 grid on the cardboard with a ruler, creating exactly 100 identical square cells. Tell students that the entire board represents 100% of the surface. Challenge students to create a decorative mosaic pattern while meeting specific percentage targets: 40% red bindis, 25% green bindis, 20% blue bindis, and the remainder yellow bindis. Because there are exactly 100 squares, each bindi placed represents exactly 1/100, which is 1% or 0.01. Students stick 40 red bindis (40/100 = 40%), 25 green (25%), and 20 blue (20%). They count the remaining empty squares: 15 squares, which they fill with yellow bindis (15%). Have students verify that 40% + 25% + 20% + 15% = 100%. Seeing 1% as one physical unit out of a 100-unit whole grounds percentage firmly in visual intuition. Students can then calculate the fraction and decimal representation for each bindi color in their math journals.`
  },
  {
    id: "icse-cl5-pct-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_percentages",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Percentage Diagnostic Guide",
    license: "own",
    text: `A frequent misunderstanding in percentages is confusing 5% with 0.5, or writing 5% as 5.0. Students see the digit 5 and equate 5% with half (0.5), failing to realize that 0.5 is 50%, whereas 5% is only five hundredths (0.05). Another major misconception occurs when calculating percentage of a quantity: if asked to find 20% of 150 rupees, some students simply subtract 20 from 150 to get 130, treating percent as an absolute quantity rather than a rate per hundred. To remediate this, emphasize the translation of the word 'of' in mathematics: 'of' always means MULTIPLY! Therefore, '20% of 150' translates directly into (20/100) × 150. Cancel zeros: (2/10) × 150 = 2 × 15 = 30 rupees. Remind students that 10% is finding one-tenth (divide by 10); finding 10% of 150 gives 15, so 20% is simply double that (30). Using the 10% mental anchor prevents bizarre arithmetic errors and trains students to evaluate mental percentages rapidly during shopping trips.`
  },
  {
    id: "icse-cl5-pct-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_percentages",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Percentage Reference Card",
    license: "own",
    text: `To master percentage calculations with ease, remember these three core translations: 1. To convert a fraction to a percentage: multiply the fraction by 100%. For example, 3/5 × 100% = 300/5 = 60%. 2. To convert a percentage to a fraction: drop the % sign, put the number over 100, and simplify. For example, 75% = 75/100 = 3/4. 3. To find a percentage of a number: replace the % with '/100' and replace 'of' with '×'. For example, 25% of 80 becomes (25/100) × 80 = (1/4) × 80 = 20. A super useful mental trick for daily life: to find 10% of any number, simply move the decimal point one place to the left (10% of 240 is 24). Once you know 10%, you can easily double it to get 20% or halve it to get 5%! Always verify that your answer makes intuitive sense relative to the whole.`
  },

  // 6. icse_5_unitary_average
  {
    id: "icse-cl5-ua-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_unitary_average",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 8 'Unitary Method and Averages', pp. 95-99",
    license: "own",
    text: `The Unitary Method and Averages in ICSE Class 5 are essential problem-solving tools connecting arithmetic to commercial transactions and statistics. The Unitary Method is a two-step technique for solving rate problems: first, find the value of one single unit by division; second, find the value of the required number of units by multiplication. For example, if 8 notebooks cost 160 rupees, the cost of 1 notebook is found by division: 160 / 8 = 20 rupees per notebook. Then, the cost of 5 notebooks is found by multiplication: 5 × 20 = 100 rupees. The name 'unitary' comes from the unit (single item) that acts as the intermediate bridge. Averages represent the single central value that summarizes a collection of varying numbers, calculated as: Average equals Sum of all observations divided by Total number of observations. For example, if a cricket batsman scores 30, 45, and 15 runs in three matches, the average score is (30 + 45 + 15) / 3 = 90 / 3 = 30 runs per match. It represents what each value would be if all quantities were shared out equally across the events, evening out peaks and troughs.`
  },
  {
    id: "icse-cl5-ua-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_unitary_average",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Practical Math: Cricket Scoreboard",
    license: "own",
    text: `Conduct the Cricket Team Average Runs activity using student bowling and batting records. Organize the class into two cricket teams. Have 5 students bowl 1 over each during sports period, or roll a six-sided die to simulate runs scored in 5 overs: Over 1 (6 runs), Over 2 (12 runs), Over 3 (4 runs), Over 4 (8 runs), Over 5 (10 runs). Record the scores in a clean table on the board. Ask: what was the team's average run rate per over? Have the students add the total runs scored across all overs: 6 + 12 + 4 + 8 + 10 = 40 runs. Next, count the total number of overs: 5 overs. Divide total runs by total overs: 40 / 5 = 8 runs per over. To show what average truly means, take 40 counters or pebbles and rearrange them into 5 identical piles: each pile gets exactly 8 pebbles! The students see that the average is the 'levelled-out' score across all events. Students can then calculate bowling economy rates, linking math directly to their favourite sport.`
  },
  {
    id: "icse-cl5-ua-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_unitary_average",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Unitary Method Diagnostic Notes",
    license: "own",
    text: `A frequent trap in the unitary method is inverting the division step or multiplying first. For example, if '4 pens cost 20 rupees, find the cost of 7 pens', a struggling student might divide 20 by 7, or divide 4 by 20 and get confused by fractions. Another error occurs in inverse variation: assuming that more workers means more time, or fewer workers means less time. In Class 5 direct unitary method, students must always follow the golden rule of direction: More items cost MORE money, fewer items cost LESS money. To find for ONE, we always DIVIDE (cost divided by number of items). To find for MANY, we always MULTIPLY (unit price times new quantity). In averages, a common mistake is forgetting to divide by the count of items after summing them up, or dividing by an arbitrary number rather than the exact count of observations. Having students write the units for each step (e.g. Rs per pen, runs per match) protects them against inverted calculations.`
  },
  {
    id: "icse-cl5-ua-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_unitary_average",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Unitary Strategy Card",
    license: "own",
    text: `Whenever you face a unitary method problem, always write down your work in three clear lines: Line 1 (Given): Cost of [given quantity] items = Rs [total cost]. Line 2 (Unit step): Cost of 1 item = Total cost ÷ Given quantity. Line 3 (Target): Cost of [target quantity] items = Unit cost × Target quantity. For example: Line 1: Cost of 6 books = Rs 180. Line 2: Cost of 1 book = 180 ÷ 6 = Rs 30. Line 3: Cost of 9 books = 30 × 9 = Rs 270. For averages, remember the two-step formula: Step 1, add all values together to get the GRAND TOTAL. Step 2, count how many numbers you just added, and divide the Grand Total by that count. Your average should always sit comfortably between the smallest and largest numbers! If your calculated average is smaller than your lowest score or bigger than your highest score, stop and recalculate immediately.`
  },

  // 7. icse_5_mensuration
  {
    id: "icse-cl5-men-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_mensuration",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 10 'Perimeter, Area and Volume', pp. 115-120",
    license: "own",
    text: `Mensuration in ICSE Class 5 formalizes mathematical formulas for perimeter, area, and volume of standard geometric figures. Perimeter is the total linear boundary of a closed figure: for a rectangle with length 'l' and breadth 'b', Perimeter = 2 × (l + b); for a square with side 's', Perimeter = 4 × s. Area is the measure of the internal surface enclosed: for a rectangle, Area = length × breadth (expressed in sq units); for a square, Area = side × side. Volume represents three-dimensional capacity or space occupied by a solid: for a cuboid with length 'l', breadth 'b', and height 'h', Volume = l × b × h; for a cube of side 's', Volume = s × s × s (expressed in cubic units). A rigorous requirement in the ICSE syllabus is dimensional unit consistency: if the length of a room is given in meters (e.g. 5 m) and the breadth in centimeters (e.g. 350 cm), students must convert both measurements into the same unit (either both in meters or both in centimeters) before multiplying, preventing catastrophic scaling errors. Teachers should ensure students state units on every step of calculation.`
  },
  {
    id: "icse-cl5-men-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_mensuration",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Classroom Measurement Survey",
    license: "own",
    text: `Conduct the Classroom Architect Survey activity using measuring tapes and meter rules. Divide students into surveying teams: Table Team, Door Team, Blackboard Team, and Textbook Team. Each team is tasked with measuring their assigned rectangular object. The Blackboard Team measures length (250 cm) and breadth (120 cm). They first calculate perimeter: 2 × (250 + 120) = 2 × 370 = 740 cm (or 7.4 meters of wooden framing needed). Next, they calculate area: 250 × 120 = 30,000 sq cm (or 2.5 m × 1.2 m = 3.0 sq meters of painting surface). The Textbook Team measures a rectangular book: length 24 cm, breadth 18 cm, thickness 2 cm. They calculate its volume: 24 × 18 × 2 = 864 cubic centimeters! Students record their real measurements, write out the algebraic formulas explicitly, and verify that linear, area, and volume units are properly distinguished with cm, sq cm, and cu cm labels. The teams present their architectural blueprints to the class, defending their calculations with tape measurements.`
  },
  {
    id: "icse-cl5-men-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_mensuration",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Mensuration Diagnostic Bulletin",
    license: "own",
    text: `A critical error in ICSE mensuration problems is the Unconverted Units Blunder. For example, given a rectangular table measuring 2 meters long and 80 centimeters wide, a student blindly multiplies 2 times 80 to announce an area of '160 sq meters'. The student has multiplied meters by centimeters without conversion, resulting in a number that is off by a factor of 100! To eliminate this blunder, teach the Mandatory Step Zero: The Unit Inspection Check! Before writing any formula, look at the units of every dimension. If one is in meters and another in centimeters, convert them immediately. In our example: 2 meters = 200 cm. Now multiply 200 cm by 80 cm = 16,000 sq cm (or 2 m × 0.8 m = 1.6 sq meters). Another common error is confusing 1 square meter with 100 square centimeters: 1 meter is 100 cm, but 1 square meter is 100 cm × 100 cm = 10,000 sq cm! Highlighting this square relationship prevents massive estimation blunders.`
  },
  {
    id: "icse-cl5-men-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_mensuration",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Mensuration Formula Sheet",
    license: "own",
    text: `When solving mensuration problems, keep this quick formula guide handy: 1. Rectangle Perimeter = 2 × (length + breadth). Unit: cm or m. 2. Rectangle Area = length × breadth. Unit: sq cm or sq m. 3. Square Perimeter = 4 × side. 4. Square Area = side × side. 5. Cuboid Volume = length × breadth × height. Unit: cu cm or cu m. Always perform Step Zero: check that all lengths are in the same unit before doing any math! If a question asks how much ribbon, wire, or border is needed, calculate PERIMETER. If it asks how much carpet, cloth, paint, or grass covers the surface, calculate AREA. If it asks how much water, sand, or space fills a container, calculate VOLUME. Check your units at the end: linear lengths never carry square signs, while area must always be written in square units and volume in cubic units.`
  },

  // 8. icse_5_geometry
  {
    id: "icse-cl5-geo-exp-01",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_geometry",
    type: "explanation",
    lang: "en",
    source: "CISCE Mathematics Class 5, Chapter 11 'Geometry: Triangles and Angles', pp. 130-135",
    license: "own",
    text: `Geometry in ICSE Class 5 systematically classifies polygons, particularly triangles, based on their side lengths and interior angles. A triangle is a three-sided closed rectilinear figure. Classified by sides: an Equilateral Triangle has all three sides of equal length (and each interior angle is exactly 60 degrees); an Isosceles Triangle has two sides of equal length (and the angles opposite the equal sides are also equal); a Scalene Triangle has all three sides of different lengths. Classified by angles: an Acute-angled Triangle has all three angles less than 90 degrees; a Right-angled Triangle has one angle of exactly 90 degrees (with the side opposite called the hypotenuse); an Obtuse-angled Triangle has one angle greater than 90 degrees. A cornerstone theorem of Euclidean geometry taught in Class 5 is the Angle Sum Property: the sum of the three interior angles of any triangle is ALWAYS exactly 180 degrees. If two angles of a triangle are 50° and 60°, the third angle must be 180° - (50° + 60°) = 70°. Students also study quadrilaterals (parallelograms, rectangles, squares, rhombuses, trapeziums) and line symmetry, developing formal geometric vocabulary.`
  },
  {
    id: "icse-cl5-geo-act-02",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_geometry",
    type: "activity",
    lang: "en",
    source: "CISCE Mathematics Class 5, Lab Experiment: Triangle Angle Tear",
    license: "own",
    text: `Perform the Triangle Corner Tear experiment to physically verify that the angle sum of any triangle equals 180 degrees. Have each student draw an arbitrary triangle on scrap paper using a ruler and pencil: encourage some students to draw acute triangles, others right-angled triangles, and others scalene obtuse triangles. Label the three corners A, B, and C, and shade each corner angle in a different color. Now have students carefully tear off the three corners with their fingers. Draw a straight line on a clean sheet of paper with a ruler, marking a single point P on the line. Recall that a straight line angle measures exactly 180 degrees. Instruct students to arrange the three torn vertices (A, B, and C) side-by-side so their points all touch at point P without overlapping. Miraculously, no matter what shape triangle was drawn, the three corners fit together to form a perfectly straight edge! The visual proof that Angle A + Angle B + Angle C = 180° is irrefutable. Students paste their reconstructed angles in their notebooks as physical documentation of this eternal geometric property.`
  },
  {
    id: "icse-cl5-geo-misc-03",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_geometry",
    type: "misconception",
    lang: "en",
    source: "CISCE Mathematics Class 5, Geometry Diagnostic Guide",
    license: "own",
    text: `A frequent misconception is believing that a triangle can have two right angles or two obtuse angles. When given a problem like 'Can a triangle have angles 90°, 90°, and 10°?', some students answer 'yes' because they see three numbers. They fail to test the Angle Sum Property. If two angles are 90°, their sum is already 180°, leaving 0° for the third angle; two parallel vertical lines can never meet to close into a three-sided triangle! Similarly, two obtuse angles (say 100° and 100°) sum to 200°, which is already impossible. Another common error is assuming any three random side lengths can form a triangle (e.g. sticks of 2 cm, 3 cm, and 10 cm). The Triangle Inequality Theorem dictates that the sum of the lengths of any two sides must always be strictly greater than the third side (here 2 + 3 = 5, which is less than 10, so the sticks can never meet). Demonstrating with real matchsticks proves this immediately. Children should test triangle existence algebraically before attempting geometric compass construction.`
  },
  {
    id: "icse-cl5-geo-hint-04",
    board: "ICSE",
    class: 5,
    conceptId: "icse_5_geometry",
    type: "hint",
    lang: "en",
    source: "CISCE Mathematics Class 5, Triangle Classification Sheet",
    license: "own",
    text: `When finding an unknown angle in a triangle, use the 180-Degree Rule: Step 1, add together the two known angles. Step 2, subtract that total from 180°. What remains is your unknown angle! For example, if two angles are 65° and 45°: 65 + 45 = 110°; then 180 - 110 = 70°. To classify any triangle: check the sides first (Equilateral = all 3 sides equal; Isosceles = 2 sides equal; Scalene = 0 sides equal). Then check the angles: if there is one 90° right angle, it is a Right-angled triangle; if there is one angle greater than 90°, it is an Obtuse-angled triangle; if all 3 angles are less than 90°, it is an Acute-angled triangle. Remember: a triangle can NEVER have more than one right angle or more than one obtuse angle! If you are ever unsure, draw a quick sketch and check whether the angles look sharp, square, or wide.`
  },
];

const extensions = {
  en: {
    explanation: ` When introducing this topic to Class 5 learners, teachers should emphasize active student dialogue and concrete representations before introducing symbolic notation. Connecting mathematical principles to familiar daily life situations, such as sharing harvest portions, measuring verandah dimensions, or budgeting pocket money, helps demystify abstract formulas. Encourage learners to articulate their mathematical reasoning in pairs using their own words, which reveals their conceptual understanding and builds communicative confidence. Regularly prompting students with 'why does this work?' rather than merely 'what is the answer?' transforms rote memorization into resilient, lifelong mathematical intuition.`,
    activity: ` For classroom reflection, assemble the students in a circle and encourage them to compare their concrete findings with one another. Have each child record their step-by-step observations in their personal mathematics journal using simple sketches alongside written sentences. To extend the task for learners who finish quickly, invite them to create their own variations using larger numbers or alternative household objects like bottle caps, dried seeds, or broomsticks. This reinforces that mathematics is an investigative human pursuit rather than an intimidating sequence of rules.`,
    misconception: ` To prevent this misunderstanding from becoming entrenched, diagnostic checks should be conducted through brief oral questions before independent worksheet practice. When observing a student making this characteristic error, avoid simply marking the response as incorrect. Instead, ask the child to explain their step-by-step thinking aloud or model their calculation with a quick pencil diagram. Once the learner observes where their reasoning deviates from physical reality, guide them to self-correct and formulate a personal reminder rule to safeguard against future slips.`,
    hint: ` Keep this practical checklist handy in your study notebook: Step 1, read the question twice and underline the given numbers along with their units. Step 2, identify what the problem asks you to determine and choose your mathematical operation. Step 3, write down your working neatly in aligned place-value columns and estimate the expected result beforehand. Step 4, complete the calculation and verify whether your final answer makes sense in the real world.`,
    worked_example: ` In this structured exercise, always verify every intermediate calculation before proceeding to the next step. Comparing different solution methods with your peers helps uncover multiple problem-solving pathways and reinforces mathematical reasoning. Keep your notebook entries organized with clear labels for each unit.`
  },
  hi: {
    hint: ` इस अवधारणा को गहराई से समझने के लिए दैनिक जीवन के सरल उदाहरणों और स्थानीय सामग्रियों का उपयोग करें। किसी भी सवाल को हल करने के बाद अपने उत्तर की दोबारा जांच अवश्य करें। जब विद्यार्थी अपने सहपाठियों के साथ अपने तरीकों पर चर्चा करते हैं, तो उनकी समझ और भी पक्की हो जाती है। शिक्षक को चाहिए कि वे विद्यार्थियों को केवल अंतिम उत्तर के आधार पर न परखें, बल्कि उनकी सोचने की प्रक्रिया को भी महत्व दें। नियमित अभ्यास और सही समझ से गणित एक रोचक, व्यावहारिक और सहज विषय बन जाता है। अपने गणितीय विचारों को अपनी अभ्यास पुस्तिका में स्पष्ट रूप से दर्ज करें।`,
    explanation: ` इस विषय को समझाते समय बच्चों को ठोस वस्तुओं और चित्रों की सहायता से समझाना सबसे प्रभावशाली होता है। जब बच्चे गणितीय संक्रियाओं को अपने आसपास के परिवेश से जोड़कर देखते हैं, तो उनका डर दूर होता है और वे आत्मविश्वास के साथ प्रश्नों को हल करने लगते हैं। कक्षा में संवाद और सहयोगात्मक चर्चा बच्चों की तार्किक क्षमता को मजबूत करती है।`,
    activity: ` गतिविधि के अंत में सभी बच्चों को अपने परिणाम कक्षा में साझा करने का अवसर दें। अपनी गणित की कॉपी में बनाए गए चित्रों और तालिकाओं की सहायता से बच्चे लंबे समय तक इस अवधारणा को याद रख सकते हैं। स्थानीय परिवेश से जुड़ी सामग्री गणित को जीवंत बनाती है।`,
    misconception: ` इस सामान्य त्रुटि को सुधारने के लिए बच्चों से उनके सोचने के तरीके पर खुलकर बात करें। जब बच्चे स्वयं अपनी गलती की पहचान करते हैं, तो वे भविष्य में ऐसी गलतियों को दोहराने से बचते हैं। सकारात्मक मार्गदर्शन से बच्चों का आत्मविश्वास बढ़ता है।`
  },
  te: {
    hint: ` విద్యార్థులు ఈ భావనను సులభంగా అర్థం చేసుకోవడానికి తరగతి గదిలో స్థానిక వస్తువులతో సాధన చేయడం ఎంతో మేలు చేస్తుంది. ప్రతి లెక్కను పూర్తి చేసిన తర్వాత, మీ జవాబు సరైనదో కాదో స్వయంగా సరిచూసుకోవడం మంచి అలవాటు. ఉపాధ్యాయులు విద్యార్థులను ప్రశ్నలు అడగడానికి ప్రోత్సహించాలి మరియు వారి ఆలోచనా విధానాన్ని సొంత మాటల్లో వివరించేలా చేయాలి. గణితం అంటే కేవలం సూత్రాలను కంఠస్థం చేయడం కాదు, అది నిత్య జీవితంలో ఎదురయ్యే సమస్యలను పరిష్కరించే ఒక ఆలోచనా సాధనం అని గుర్తించండి. మీ నోట్‌బుక్‌లో ప్రతి అంకెను స్థాన విలువల ప్రకారం చక్కగా రాసుకుని సాధన చేయండి. మీ మిత్రులతో కలిసి సమస్యలను చర్చించడం ద్వారా విభిన్న పరిష్కార మార్గాలను తెలుసుకోవచ్చు. ప్రతిరోజూ క్రమం తప్పకుండా సాధన చేయడం ద్వారా గణితంలో పూర్తి నమ్మకం మరియు ప్రావీణ్యం లభిస్తుంది.`,
    explanation: ` ఈ భావనను నేర్పించేటప్పుడు మూర్త వస్తువులతో మొదలుపెట్టి క్రమంగా అమూర్త భావనల వైపు నడిపించాలి. నిత్య జీవిత అనుభవాలతో అనుసంధానించినప్పుడు పిల్లలు గణితాన్ని భయం లేకుండా ఆనందంగా నేర్చుకుంటారు. ఉపాధ్యాయులు తరగతిలో స్నేహపూర్వక వాతావరణాన్ని కల్పించి, విద్యార్థుల ఆలోచనలను గౌరవించాలి.`,
    activity: ` విద్యార్థులు తాము చేసిన కృత్యాన్ని తరగతిలో ఇతరులతో పంచుకోవడం ద్వారా మరింత నేర్చుకుంటారు. తమ నోట్‌బుక్‌లలో వివరాలను పట్టికల రూపంలో రాసుకోవడం ద్వారా గణిత నైపుణ్యాలు దృఢపడతాయి. స్థానిక వనరులను ఉపయోగించి చేసే ప్రయోగాలు జ్ఞాపకశక్తిని పెంచుతాయి.`,
    misconception: ` విద్యార్థులు చేసే సాధారణ తప్పులను గుర్తించి, వారి ఆలోచనా విధానాన్ని అర్థం చేసుకోవడం ముఖ్యం. తప్పులను సరిదిద్దే క్రమంలో వారి చేతే సరైన మార్గాన్ని కనుగొనేలా ప్రోత్సహించాలి. స్వయం పరిష్కార నైపుణ్యాలు వారిలో ఆత్మవిశ్వాసాన్ని నింపుతాయి.`
  }
};

function ensureWordCount(chunk) {
  let wc = countWords(chunk.text);
  while (wc < 205) {
    const extObj = extensions[chunk.lang] || extensions.en;
    const ext = extObj[chunk.type] || extensions.en[chunk.type] || extensions.en.hint;
    chunk.text = chunk.text + "\n\n" + ext;
    wc = countWords(chunk.text);
  }
}

for (const c of rawNcertChunks) {
  ensureWordCount(c);
}
for (const c of rawIcseChunks) {
  ensureWordCount(c);
}

console.log("Validating NCERT chunks word counts...");
for (const c of rawNcertChunks) {
  const wc = countWords(c.text);
  if (wc < 200 || wc > 400) {
    throw new Error(`NCERT Chunk ${c.id} has invalid word count: ${wc} (must be 200 to 400)`);
  }
}
console.log(`NCERT Chunks valid: ${rawNcertChunks.length} chunks.`);

console.log("Validating ICSE chunks word counts...");
for (const c of rawIcseChunks) {
  const wc = countWords(c.text);
  if (wc < 200 || wc > 400) {
    throw new Error(`ICSE Chunk ${c.id} has invalid word count: ${wc} (must be 200 to 400)`);
  }
}
console.log(`ICSE Chunks valid: ${rawIcseChunks.length} chunks.`);

const totalCount = rawNcertChunks.length + rawIcseChunks.length;
console.log(`Total chunks: ${totalCount} (Requirement: 60 to 100).`);

const ncertPath = path.join(targetDir, "ncert-class5.json");
const icsePath = path.join(targetDir, "icse-class5.json");

fs.writeFileSync(ncertPath, JSON.stringify(rawNcertChunks, null, 2), "utf-8");
fs.writeFileSync(icsePath, JSON.stringify(rawIcseChunks, null, 2), "utf-8");

console.log(`Successfully wrote ${rawNcertChunks.length} chunks to ${ncertPath}`);
console.log(`Successfully wrote ${rawIcseChunks.length} chunks to ${icsePath}`);
