import { prisma } from '../config/prisma.js'
import { generateEmbedding, cosineSimilarity, computeContentHash } from './ai.service.js'
import { HttpError } from '../middleware/errorHandler.js'
import { AuthUser } from '../middleware/auth.js'

export const SIMILARITY_THRESHOLD = Number(process.env.ANALYTICS_SIMILARITY_THRESHOLD) || 0.78

export interface AnalyticsFilters {
  startDate?: string
  endDate?: string
  subjectId?: string
  limit?: number
  page?: number
}

/**
 * Normalizes an academic doubt into a clean, canonical topic title.
 */
export function normalizeTopicName(title: string, content: string, aiTags: string[] = []): string {
  const text = `${title} ${content}`.toLowerCase()

  // Canonical Computer Science & Engineering Academic Topics mapping
  const canonicalRules: Array<{ pattern: RegExp; canonical: string }> = [
    { pattern: /\b(jwt|json web token|bearer token|auth token)\b/i, canonical: 'JWT Authentication' },
    { pattern: /\b(red[- ]black tree|rb tree|tree rotation)\b/i, canonical: 'Red-Black Trees' },
    { pattern: /\b(binary search tree|bst|tree traversal|inorder|preorder)\b/i, canonical: 'Binary Search Trees' },
    { pattern: /\b(binary search|lower bound|upper bound)\b/i, canonical: 'Binary Search Algorithms' },
    { pattern: /\b(dijkstra|shortest path|bellman[- ]ford|floyd[- ]warshall)\b/i, canonical: 'Shortest Path Algorithms' },
    { pattern: /\b(bfs|dfs|breadth first|depth first|graph traversal)\b/i, canonical: 'Graph Traversal (BFS / DFS)' },
    { pattern: /\b(merge sort|quick sort|sorting algorithm|heap sort)\b/i, canonical: 'Sorting Algorithms' },
    { pattern: /\b(dynamic programming|dp|memoization|tabulation|knapsack)\b/i, canonical: 'Dynamic Programming' },
    { pattern: /\b(deadlock|banker'?s algorithm|race condition|mutex|semaphore)\b/i, canonical: 'Process Synchronization & Deadlocks' },
    { pattern: /\b(cpu scheduling|round robin|fcfs|sjf|priority scheduling)\b/i, canonical: 'Operating System Scheduling' },
    { pattern: /\b(paging|virtual memory|page replacement|lru|tlb)\b/i, canonical: 'Virtual Memory & Paging' },
    { pattern: /\b(normalization|1nf|2nf|3nf|bcnf|functional dependency)\b/i, canonical: 'Database Normalization' },
    { pattern: /\b(sql join|inner join|left join|outer join|cartesian product)\b/i, canonical: 'SQL Joins & Relational Queries' },
    { pattern: /\b(indexing|b[- ]tree|hash index|query optimization)\b/i, canonical: 'Database Indexing & Optimization' },
    { pattern: /\b(tcp|udp|three[- ]way handshake|osi model|ip protocol)\b/i, canonical: 'Computer Networks (TCP/IP & OSI)' },
    { pattern: /\b(recursion|recursive step|base condition|tail recursion)\b/i, canonical: 'Recursion & Backtracking' },
    { pattern: /\b(linked list|doubly linked list|cycle detection|floyd)\b/i, canonical: 'Linked List Data Structures' },
    { pattern: /\b(stack|queue|monotonic stack|priority queue|heap)\b/i, canonical: 'Linear Data Structures (Stack & Queue)' },
    { pattern: /\b(time complexity|big o|space complexity|asymptotic notation)\b/i, canonical: 'Asymptotic Complexity Analysis' },
    { pattern: /\b(docker|container|dockerfile|kubernetes|microservices)\b/i, canonical: 'Cloud & Container Technologies' }
  ]

  for (const rule of canonicalRules) {
    if (rule.pattern.test(text)) {
      return rule.canonical
    }
  }

  // If AI tags exist and contain a good candidate
  if (aiTags && aiTags.length > 0) {
    const cleanTag = aiTags[0].trim().replace(/^#/, '')
    if (cleanTag.length >= 3 && cleanTag.length <= 40) {
      return cleanTag.charAt(0).toUpperCase() + cleanTag.slice(1)
    }
  }

  // Fallback: derive from clean doubt title
  const cleanTitle = title
    .replace(/^(what is|how to|why does|explain|how do we|can someone|doubt:?|help with)\s+/i, '')
    .replace(/[?.,!]+$/, '')
    .trim()

  if (cleanTitle.length > 0) {
    const words = cleanTitle.split(/\s+/).slice(0, 5).join(' ')
    return words.charAt(0).toUpperCase() + words.slice(1)
  }

  return 'General Academic Concept'
}

/**
 * Assigns a doubt to a semantic TopicCluster.
 * Reuses existing vectors or generates a new embedding, checks similarity against existing clusters,
 * and creates a new cluster if similarity < threshold.
 */
export async function assignDoubtToTopicCluster(doubtId: string): Promise<any> {
  const doubt = await prisma.doubt.findUnique({
    where: { id: doubtId },
    include: {
      subject: true,
      embedding: true,
      topicAssignment: true
    }
  })

  if (!doubt) {
    throw new HttpError(404, 'Doubt not found')
  }

  // If already assigned, return existing assignment
  if (doubt.topicAssignment) {
    return doubt.topicAssignment
  }

  // 1. Get or generate embedding vector
  let vector = doubt.embedding?.vector
  if (!vector || vector.length === 0) {
    const textToEmbed = `${doubt.title}\n${doubt.content}`
    const newVec = await generateEmbedding(textToEmbed)
    if (newVec) {
      vector = newVec
      const contentHash = computeContentHash([doubt.title, doubt.content])
      await prisma.doubtEmbedding.upsert({
        where: { doubtId: doubt.id },
        create: { doubtId: doubt.id, contentHash, vector: newVec },
        update: { contentHash, vector: newVec }
      }).catch(err => console.warn('[Analytics] Embedding save warning:', err))
    }
  }

  // 2. Search existing clusters for matching subject
  const existingClusters = await prisma.topicCluster.findMany({
    where: { subjectId: doubt.subjectId || null },
    take: 100
  })

  let bestCluster: any = null
  let bestSimilarity = -1

  if (vector && vector.length > 0) {
    for (const cluster of existingClusters) {
      if (cluster.vector && cluster.vector.length === vector.length) {
        const sim = cosineSimilarity(vector, cluster.vector)
        if (sim > bestSimilarity) {
          bestSimilarity = sim
          bestCluster = cluster
        }
      }
    }
  }

  // 3. Match found above similarity threshold
  if (bestCluster && bestSimilarity >= SIMILARITY_THRESHOLD) {
    const assignment = typeof (prisma.doubtTopicAssignment as any).upsert === 'function'
      ? await prisma.doubtTopicAssignment.upsert({
          where: { doubtId: doubt.id },
          create: {
            doubtId: doubt.id,
            topicId: bestCluster.id,
            similarity: Number(bestSimilarity.toFixed(3))
          },
          update: {
            topicId: bestCluster.id,
            similarity: Number(bestSimilarity.toFixed(3))
          }
        })
      : await prisma.doubtTopicAssignment.create({
          data: {
            doubtId: doubt.id,
            topicId: bestCluster.id,
            similarity: Number(bestSimilarity.toFixed(3))
          }
        })
    return assignment
  }

  // 4. No cluster matched threshold: create a new normalized TopicCluster
  const topicName = normalizeTopicName(doubt.title, doubt.content, doubt.aiTags)

  // Check if a cluster with exact same normalized name exists in this subject
  let targetCluster = existingClusters.find(
    c => c.name.toLowerCase() === topicName.toLowerCase()
  )

  if (!targetCluster) {
    targetCluster = await prisma.topicCluster.create({
      data: {
        name: topicName,
        subjectId: doubt.subjectId || null,
        vector: vector || []
      }
    })
  }

  const assignment = typeof (prisma.doubtTopicAssignment as any).upsert === 'function'
    ? await prisma.doubtTopicAssignment.upsert({
        where: { doubtId: doubt.id },
        create: {
          doubtId: doubt.id,
          topicId: targetCluster.id,
          similarity: bestSimilarity > 0 ? Number(bestSimilarity.toFixed(3)) : 1.0
        },
        update: {
          topicId: targetCluster.id,
          similarity: bestSimilarity > 0 ? Number(bestSimilarity.toFixed(3)) : 1.0
        }
      })
    : await prisma.doubtTopicAssignment.create({
        data: {
          doubtId: doubt.id,
          topicId: targetCluster.id,
          similarity: bestSimilarity > 0 ? Number(bestSimilarity.toFixed(3)) : 1.0
        }
      })

  return assignment
}

/**
 * Syncs any historical or unassigned doubts into topic clusters.
 */
export async function syncPendingDoubtAssignments(): Promise<number> {
  const unassigned = await prisma.doubt.findMany({
    where: {
      topicAssignment: null
    },
    select: { id: true },
    take: 50
  })

  let assignedCount = 0
  for (const d of unassigned) {
    try {
      await assignDoubtToTopicCluster(d.id)
      assignedCount++
    } catch (err) {
      console.warn(`[Analytics] Failed clustering doubt ${d.id}:`, err)
    }
  }

  return assignedCount
}

/**
 * Validates faculty/admin authorization and filters.
 */
async function authorizeAndBuildWhere(filters: AnalyticsFilters, user: AuthUser) {
  // Sync pending unassigned doubts automatically in the background
  syncPendingDoubtAssignments().catch(() => {})

  const isFaculty = user.profession === 'PROFESSOR' || user.role === 'FACULTY'
  const isAdmin = user.role === 'ADMIN'

  // If faculty, find authorized subjects
  let allowedSubjectIds: string[] | null = null
  if (isFaculty && !isAdmin) {
    const memberships = await prisma.subjectMember.findMany({
      where: { userId: user.userId },
      select: { subjectId: true }
    })
    // If faculty has subject memberships, restrict to them; otherwise allow all curriculum subjects
    if (memberships.length > 0) {
      allowedSubjectIds = memberships.map(m => m.subjectId)
    }
  }

  if (filters.subjectId && allowedSubjectIds && !allowedSubjectIds.includes(filters.subjectId)) {
    throw new HttpError(403, 'Forbidden: You are not authorized to view analytics for this subject')
  }

  const now = new Date()
  const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const startDate = filters.startDate ? new Date(filters.startDate) : defaultStartDate
  const endDate = filters.endDate ? new Date(filters.endDate) : now

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new HttpError(400, 'Invalid date range parameter')
  }

  if (startDate > endDate) {
    throw new HttpError(400, 'startDate cannot be after endDate')
  }

  const whereDoubt: any = {
    createdAt: {
      gte: startDate,
      lte: endDate
    }
  }

  if (filters.subjectId) {
    whereDoubt.subjectId = filters.subjectId
  } else if (allowedSubjectIds && allowedSubjectIds.length > 0) {
    whereDoubt.subjectId = { in: allowedSubjectIds }
  }

  return {
    whereDoubt,
    startDate,
    endDate,
    allowedSubjectIds
  }
}

/**
 * 1. Analytics Summary Metrics
 */
export async function getAnalyticsSummary(filters: AnalyticsFilters, user: AuthUser) {
  const { whereDoubt, startDate, endDate } = await authorizeAndBuildWhere(filters, user)

  // 1. Total doubts in period
  const totalDoubts = await prisma.doubt.count({ where: whereDoubt })

  // 2. Distinct topics identified
  const distinctTopicsResult = await prisma.doubtTopicAssignment.findMany({
    where: {
      doubt: whereDoubt
    },
    select: { topicId: true },
    distinct: ['topicId']
  })
  const distinctTopicsCount = distinctTopicsResult.length

  // 3. Top topic
  const topicCounts = await prisma.doubtTopicAssignment.groupBy({
    by: ['topicId'],
    where: {
      doubt: whereDoubt
    },
    _count: { doubtId: true },
    orderBy: {
      _count: {
        doubtId: 'desc'
      }
    },
    take: 1
  })

  let topTopic = 'None'
  let topTopicCount = 0
  if (topicCounts.length > 0 && topicCounts[0]._count) {
    topTopicCount = topicCounts[0]._count.doubtId
    const cluster = await prisma.topicCluster.findUnique({
      where: { id: topicCounts[0].topicId },
      select: { name: true }
    })
    if (cluster) topTopic = cluster.name
  }

  // 4. Repeated / Semantically similar doubts count
  // Doubts that share a topic cluster with at least 1 other doubt and have similarity >= 0.78
  const repeatedClusters = await prisma.doubtTopicAssignment.groupBy({
    by: ['topicId'],
    where: {
      doubt: whereDoubt,
      similarity: { gte: 0.78 }
    },
    _count: { doubtId: true },
    having: {
      doubtId: {
        _count: { gt: 1 }
      }
    }
  })
  const repeatedDoubtsCount = repeatedClusters.reduce((sum, c) => sum + (c._count?.doubtId || 0), 0)

  // 5. Helpfulness rate (% of answers in period with upvotes or marked accepted)
  const answersInPeriod = await prisma.answer.findMany({
    where: {
      doubt: whereDoubt,
      isDeleted: false
    },
    select: {
      id: true,
      upvotes: { select: { id: true } },
      doubt: { select: { acceptedAnswerId: true } }
    }
  })

  let helpfulnessRate = 0
  if (answersInPeriod.length > 0) {
    const helpfulCount = answersInPeriod.filter(
      ans => (ans.upvotes && ans.upvotes.length > 0) || ans.doubt?.acceptedAnswerId === ans.id
    ).length
    helpfulnessRate = Math.round((helpfulCount / answersInPeriod.length) * 100)
  }

  return {
    totalDoubts,
    distinctTopics: distinctTopicsCount,
    topTopic,
    topTopicCount,
    repeatedDoubtsCount,
    helpfulnessRate,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    }
  }
}

/**
 * 2. Most Asked Topics Bar Chart Data
 */
export async function getMostAskedTopics(filters: AnalyticsFilters, user: AuthUser) {
  const { whereDoubt } = await authorizeAndBuildWhere(filters, user)
  const limit = Math.min(filters.limit || 10, 50)

  const grouped = await prisma.doubtTopicAssignment.groupBy({
    by: ['topicId'],
    where: {
      doubt: whereDoubt
    },
    _count: { doubtId: true },
    orderBy: {
      _count: {
        doubtId: 'desc'
      }
    },
    take: limit
  })

  const totalDoubts = await prisma.doubt.count({ where: whereDoubt })

  const topics = await Promise.all(
    grouped.map(async item => {
      const cluster = await prisma.topicCluster.findUnique({
        where: { id: item.topicId },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          assignments: {
            take: 1,
            include: { doubt: { select: { title: true } } }
          }
        }
      })

      const count = item._count.doubtId
      const percentage = totalDoubts > 0 ? Math.round((count / totalDoubts) * 100) : 0
      const topicName = cluster?.name || 'Unknown Topic'

      return {
        id: item.topicId,
        topic: topicName,
        name: topicName,
        subjectName: cluster?.subject?.name || 'General Academic',
        subjectCode: cluster?.subject?.code || null,
        subject: cluster?.subject ? {
          id: cluster.subject.id,
          name: cluster.subject.name,
          code: cluster.subject.code
        } : null,
        count,
        doubtCount: count,
        percentage,
        percentageOfTotal: percentage,
        representativeQuestion: cluster?.assignments?.[0]?.doubt?.title || topicName
      }
    })
  )

  return {
    topics,
    totalDoubts
  }
}

/**
 * 3. Doubt Trends Over Time (Daily / Weekly Buckets)
 */
export async function getDoubtTrends(filters: AnalyticsFilters, user: AuthUser) {
  const { whereDoubt, startDate, endDate } = await authorizeAndBuildWhere(filters, user)

  const rawDoubts = await prisma.doubt.findMany({
    where: whereDoubt,
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  })
  const doubts = Array.isArray(rawDoubts) ? rawDoubts : []

  const spanDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  const isWeekly = spanDays > 45

  // Initialize timeline buckets
  const buckets: Record<string, number> = {}

  if (isWeekly) {
    let curr = new Date(startDate)
    while (curr <= endDate) {
      const year = curr.getFullYear()
      const weekNum = Math.ceil(((curr.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7)
      const key = `${year}-W${weekNum}`
      if (!buckets[key]) buckets[key] = 0
      curr.setDate(curr.getDate() + 7)
    }
  } else {
    let curr = new Date(startDate)
    while (curr <= endDate) {
      const key = curr.toISOString().slice(0, 10)
      buckets[key] = 0
      curr.setDate(curr.getDate() + 1)
    }
  }

  // Populate counts from real database records
  for (const d of doubts) {
    if (isWeekly) {
      const year = d.createdAt.getFullYear()
      const weekNum = Math.ceil(((d.createdAt.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7)
      const key = `${year}-W${weekNum}`
      if (buckets[key] !== undefined) buckets[key]++
    } else {
      const key = d.createdAt.toISOString().slice(0, 10)
      if (buckets[key] !== undefined) buckets[key]++
    }
  }

  const trends = Object.entries(buckets).map(([date, count]) => {
    // Format human-friendly label e.g. "Oct 24"
    let label = date
    if (!date.includes('W')) {
      const d = new Date(date)
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return {
      date,
      label,
      count
    }
  })

  return {
    trends,
    spanDays,
    totalCount: doubts.length
  }
}

/**
 * 4. Subject-Wise Analytics & Period Comparison
 */
export async function getSubjectWiseStats(filters: AnalyticsFilters, user: AuthUser) {
  const { whereDoubt, startDate, endDate, allowedSubjectIds } = await authorizeAndBuildWhere(filters, user)

  // Current period counts per subject
  const currentCounts = await prisma.doubt.groupBy({
    by: ['subjectId'],
    where: whereDoubt,
    _count: { id: true }
  })

  // Previous equivalent period for delta calculation
  const periodDuration = endDate.getTime() - startDate.getTime()
  const prevStartDate = new Date(startDate.getTime() - periodDuration)
  const prevEndDate = new Date(startDate.getTime())

  const prevWhere: any = {
    createdAt: { gte: prevStartDate, lt: prevEndDate }
  }
  if (filters.subjectId) {
    prevWhere.subjectId = filters.subjectId
  } else if (allowedSubjectIds && allowedSubjectIds.length > 0) {
    prevWhere.subjectId = { in: allowedSubjectIds }
  }

  const prevCounts = await prisma.doubt.groupBy({
    by: ['subjectId'],
    where: prevWhere,
    _count: { id: true }
  })

  const prevCountMap = new Map<string, number>()
  for (const p of prevCounts) {
    prevCountMap.set(p.subjectId, p._count.id)
  }

  // Fetch all relevant subjects
  const subjectIds = Array.from(new Set([...currentCounts.map(c => c.subjectId), ...(allowedSubjectIds || [])]))
  const subjects = await prisma.subject.findMany({
    where: subjectIds.length > 0 ? { id: { in: subjectIds } } : undefined,
    select: { id: true, name: true, code: true }
  })

  const stats = await Promise.all(
    subjects.map(async s => {
      const current = currentCounts.find(c => c.subjectId === s.id)?._count.id || 0
      const previous = prevCountMap.get(s.id) || 0

      // Distinct topics in this subject
      const topicsCount = await prisma.doubtTopicAssignment.count({
        where: {
          doubt: {
            subjectId: s.id,
            createdAt: whereDoubt.createdAt
          }
        }
      })

      let percentageChange = 0
      if (previous > 0) {
        percentageChange = Math.round(((current - previous) / previous) * 100)
      } else if (current > 0) {
        percentageChange = 100
      }

      return {
        subjectId: s.id,
        name: s.name,
        code: s.code,
        currentCount: current,
        previousCount: previous,
        percentageChange,
        topicsCount
      }
    })
  )

  stats.sort((a, b) => b.currentCount - a.currentCount)

  return stats
}

/**
 * 5. Semantically Similar Question Groups (Privacy-Safe: Zero Student PII)
 */
export async function getSimilarDoubtClusters(filters: AnalyticsFilters, user: AuthUser) {
  const { whereDoubt } = await authorizeAndBuildWhere(filters, user)
  const limit = Math.min(filters.limit || 8, 30)

  // Find clusters with doubts in the requested period
  const clusters = await prisma.topicCluster.findMany({
    where: {
      assignments: {
        some: {
          doubt: whereDoubt
        }
      }
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      assignments: {
        where: {
          doubt: whereDoubt
        },
        include: {
          doubt: {
            select: {
              id: true,
              title: true,
              createdAt: true
            }
          }
        },
        orderBy: { similarity: 'desc' },
        take: 10
      }
    },
    take: 50
  })

  // Format into privacy-preserving groups
  const formatted = clusters
    .map(c => {
      const doubtCount = c.assignments.length
      const representativeQuestion = c.assignments[0]?.doubt.title || c.name

      // Anonymized sample question titles (no author name, no author email, no student ID!)
      const sampleQuestions = c.assignments.map(a => ({
        id: a.doubt.id,
        title: a.doubt.title,
        createdAt: a.doubt.createdAt.toISOString()
      }))

      return {
        id: c.id,
        clusterId: c.id,
        topic: c.name,
        topicName: c.name,
        subjectName: c.subject?.name || 'General Academic',
        subjectCode: c.subject?.code || null,
        subject: c.subject ? {
          id: c.subject.id,
          name: c.subject.name,
          code: c.subject.code
        } : null,
        doubtCount,
        representativeQuestion,
        sampleQuestions,
        sampleDoubts: sampleQuestions
      }
    })
    .sort((a, b) => b.doubtCount - a.doubtCount)
    .slice(0, limit)

  return formatted
}

export interface ActionableInsight {
  id: string
  type: 'SPIKE_ALERT' | 'REPETITION_WARNING' | 'HELPFULNESS_GAP' | 'SUBJECT_SURGE'
  title: string
  observation: string
  recommendation: string
  actionSuggestion?: string
  topic: string
  topicName?: string
  subject?: string
  subjectName?: string
  severity: 'high' | 'medium' | 'info'
}

/**
 * 6. Actionable Academic Insights (Evidence-Backed Deterministic Rules)
 */
export async function getActionableAcademicInsights(
  filters: AnalyticsFilters,
  user: AuthUser
): Promise<{ insights: ActionableInsight[]; hasData: boolean }> {
  const { whereDoubt } = await authorizeAndBuildWhere(filters, user)

  const totalDoubts = await prisma.doubt.count({ where: whereDoubt })
  if (totalDoubts === 0) {
    return {
      insights: [],
      hasData: false
    }
  }

  const insights: ActionableInsight[] = []

  // Check Topic Clustering
  const mostAsked = await getMostAskedTopics({ ...filters, limit: 10 }, user)
  const similarGroups = await getSimilarDoubtClusters({ ...filters, limit: 10 }, user)
  const subjectStats = await getSubjectWiseStats(filters, user)

  // Rule 1: High Repetition Warning (Students asking identical questions)
  for (const group of similarGroups) {
    if (group.doubtCount >= 3) {
      insights.push({
        id: `repeat-${group.clusterId}`,
        type: 'REPETITION_WARNING',
        title: `High question repetition in ${group.topic}`,
        observation: `${group.topic} received ${group.doubtCount} doubts with significant semantic overlap in this period.`,
        recommendation: `Consider reviewing "${group.representativeQuestion}" in the next class or posting a verified FAQ walkthrough to clear common misconceptions.`,
        actionSuggestion: `Consider reviewing "${group.representativeQuestion}" in the next class or posting a verified FAQ walkthrough to clear common misconceptions.`,
        topic: group.topic,
        topicName: group.topic,
        subject: group.subjectName,
        subjectName: group.subjectName,
        severity: group.doubtCount >= 5 ? 'high' : 'medium'
      })
    }
  }

  // Rule 2: Topic Dominance (Topic takes > 25% of all doubts)
  for (const t of mostAsked.topics) {
    if (t.count >= 4 && t.percentage >= 25) {
      insights.push({
        id: `dominant-${t.id}`,
        type: 'SPIKE_ALERT',
        title: `Academic concentration on ${t.topic}`,
        observation: `${t.topic} represents ${t.percentage}% of all doubts logged (${t.count} total questions).`,
        recommendation: `This topic is a major learning roadblock for students right now. A dedicated lab session or tutorial on ${t.topic} would provide immediate relief.`,
        actionSuggestion: `This topic is a major learning roadblock for students right now. A dedicated lab session or tutorial on ${t.topic} would provide immediate relief.`,
        topic: t.topic,
        topicName: t.topic,
        subject: t.subjectName,
        subjectName: t.subjectName,
        severity: 'high'
      })
    }
  }

  // Rule 3: Subject Volume Surge (Subject has noticeable increase)
  for (const s of subjectStats) {
    if (s.currentCount >= 5 && s.percentageChange >= 50) {
      insights.push({
        id: `subject-surge-${s.subjectId}`,
        type: 'SUBJECT_SURGE',
        title: `Noticeable doubt surge in ${s.name}`,
        observation: `Doubts in ${s.name} increased by ${s.percentageChange}% compared with the prior period (${s.currentCount} vs ${s.previousCount}).`,
        recommendation: `Inspect recent assignment deadlines or exam schedules for ${s.name} to see if students need revision support.`,
        actionSuggestion: `Inspect recent assignment deadlines or exam schedules for ${s.name} to see if students need revision support.`,
        topic: s.name,
        topicName: s.name,
        subject: s.name,
        subjectName: s.name,
        severity: 'medium'
      })
    }
  }

  // If no high-priority alerts triggered, produce constructive general insight
  if (insights.length === 0 && mostAsked.topics.length > 0) {
    const top = mostAsked.topics[0]
    insights.push({
      id: `general-trend-${top.id}`,
      type: 'SPIKE_ALERT',
      title: `Top active topic: ${top.topic}`,
      observation: `${top.topic} is currently the most inquired topic with ${top.count} questions recorded.`,
      recommendation: `Ensure supplementary lecture notes and code exercises for ${top.topic} are readily accessible on the subject board.`,
      actionSuggestion: `Ensure supplementary lecture notes and code exercises for ${top.topic} are readily accessible on the subject board.`,
      topic: top.topic,
      topicName: top.topic,
      subject: top.subjectName,
      subjectName: top.subjectName,
      severity: 'info'
    })
  }

  return {
    insights,
    hasData: true
  }
}
