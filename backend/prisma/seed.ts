import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const subjects = [
    { name: 'Data Structures', code: 'CS201', description: 'Arrays, stacks, queues, trees, graphs' },
    { name: 'Object Oriented Programming', code: 'CS202', description: 'Classes, inheritance, polymorphism' },
    { name: 'Digital Logic', code: 'CS203', description: 'Boolean algebra, combinational and sequential circuits' },
    { name: 'Operating Systems', code: 'CS204', description: 'Processes, memory, files, concurrency' },
    { name: 'Database Management Systems', code: 'CS205', description: 'SQL, normalization, transactions' }
  ]

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: { name: subject.name, description: subject.description },
      create: subject
    })
  }

  const passwordHash = await bcrypt.hash('demo123456', 10)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@doubtchain.dev' },
    update: {
      displayName: 'Demo User',
      fullName: 'Demo User',
      username: 'demouser',
      passwordHash
    },
    create: {
      email: 'demo@doubtchain.dev',
      username: 'demouser',
      displayName: 'Demo User',
      fullName: 'Demo User',
      profession: 'STUDENT',
      identificationNumber: 'DEMO-001',
      passwordHash
    }
  })

  const subjectList = await prisma.subject.findMany()
  const byCode = Object.fromEntries(subjectList.map((s) => [s.code, s.id]))

  const doubts = [
    { title: 'Circular queue implementation using arrays', content: 'How to handle front/rear when queue is full/empty in array-based circular queue?', subjectCode: 'CS201' },
    { title: 'Difference between stack and queue', content: 'Explain key differences with use cases.', subjectCode: 'CS201' },
    { title: 'Binary search tree insertion', content: 'Write logic for inserting nodes in BST without duplicates.', subjectCode: 'CS201' },
    { title: 'Dijkstra vs BFS', content: 'When to use Dijkstra over BFS for shortest path?', subjectCode: 'CS201' },
    { title: 'Time complexity of merge sort', content: 'Explain recurrence and worst case complexity of merge sort.', subjectCode: 'CS201' },
    { title: 'Constructor overloading in Java', content: 'What is constructor overloading and how does it work?', subjectCode: 'CS202' },
    { title: 'Difference between abstract class and interface', content: 'Key differences with examples.', subjectCode: 'CS202' },
    { title: 'Method overriding vs overloading', content: 'Explain with code logic.', subjectCode: 'CS202' },
    { title: 'Use of this and super keywords', content: 'When to use this() and super() in constructors?', subjectCode: 'CS202' },
    { title: 'Access modifiers in Java', content: 'Explain public/private/protected/default visibility.', subjectCode: 'CS202' },
    { title: 'Karnaugh map simplification', content: 'How to simplify 4-variable Boolean expression using K-map?', subjectCode: 'CS203' },
    { title: 'Difference between combinational and sequential circuits', content: 'Give examples for each.', subjectCode: 'CS203' },
    { title: 'SR flip flop vs JK flip flop', content: 'Compare working and truth tables.', subjectCode: 'CS203' },
    { title: 'Half adder and full adder', content: 'Design half adder and full adder with logic diagrams explanation.', subjectCode: 'CS203' },
    { title: 'Binary to Gray code conversion', content: 'Explain conversion rules with example.', subjectCode: 'CS203' },
    { title: 'Process vs thread', content: 'What are differences between process and thread?', subjectCode: 'CS204' },
    { title: 'CPU scheduling algorithms', content: 'Compare FCFS, SJF, Round Robin briefly.', subjectCode: 'CS204' },
    { title: 'Deadlock conditions', content: 'Explain necessary conditions for deadlock (Coffman conditions).', subjectCode: 'CS204' },
    { title: 'Paging vs segmentation', content: 'Key differences between paging and segmentation.', subjectCode: 'CS204' },
    { title: 'Semaphores in OS', content: 'What are binary and counting semaphores?', subjectCode: 'CS204' },
    { title: 'Normalization up to 3NF', content: 'Explain 1NF, 2NF, 3NF with example.', subjectCode: 'CS205' },
    { title: 'Primary key vs foreign key', content: 'Differences and usage in relational model.', subjectCode: 'CS205' },
    { title: 'ACID properties of transaction', content: 'Explain Atomicity, Consistency, Isolation, Durability.', subjectCode: 'CS205' },
    { title: 'SQL joins types', content: 'Explain INNER, LEFT, RIGHT, FULL OUTER joins with examples.', subjectCode: 'CS205' },
    { title: 'ER diagram cardinality', content: 'What is one-to-one, one-to-many, many-to-many?', subjectCode: 'CS205' },
    { title: 'Recursion base case importance', content: 'Why is base case importance in recursion?', subjectCode: 'CS201' },
    { title: 'Linked list vs array', content: 'Compare arrays and linked lists for insertion/deletion.', subjectCode: 'CS201' },
    { title: 'Static vs dynamic binding', content: 'Explain in Java context.', subjectCode: 'CS202' },
    { title: 'Multiplexer vs demultiplexer', content: 'Differences with applications.', subjectCode: 'CS203' },
    { title: 'File allocation methods', content: 'Compare contiguous, linked, indexed allocation.', subjectCode: 'CS204' }
  ]

  for (const d of doubts) {
    const existing = await prisma.doubt.findFirst({
      where: { title: d.title, authorId: demoUser.id }
    })
    if (existing) {
      continue
    }
    await prisma.doubt.create({
      data: {
        title: d.title,
        content: d.content,
        authorId: demoUser.id,
        subjectId: byCode[d.subjectCode]
      }
    })
  }

  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
