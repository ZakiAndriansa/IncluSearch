import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInsight } from "@/lib/insight-engine";

// GET: Retrieve or generate insight for an assessment
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { insight: true },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Check premium status from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  const isPremium =
    user?.isPremium === true &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  // If insight already exists, return it
  if (assessment.insight) {
    const insight = assessment.insight;
    return NextResponse.json({
      insight: {
        id: insight.id,
        summary: insight.summary,
        detailedAnalysis: isPremium ? insight.detailedAnalysis : null,
        priorityIssues: isPremium
          ? insight.priorityIssues
          : (insight.priorityIssues as Array<Record<string, unknown>>).map((issue, i) => ({
              title: i === 0 ? issue.title : "🔒 Premium",
              severity: issue.severity,
              description: i === 0 ? issue.description : "Upgrade ke Premium untuk melihat detail.",
              recommendation: i === 0 ? issue.recommendation : "🔒",
            })),
        domainScores: insight.domainScores,
        riskLevel: insight.riskLevel,
        recommendations: isPremium
          ? insight.recommendations
          : (insight.recommendations as Array<Record<string, unknown>>).filter(
              (r) => !r.isPremium
            ),
        strengths: insight.strengths,
        isPremium,
      },
    });
  }

  // Generate new insight
  const insightData = generateInsight(assessment);

  const created = await prisma.assessmentInsight.create({
    data: {
      assessmentId: assessment.id,
      summary: insightData.summary,
      detailedAnalysis: insightData.detailedAnalysis,
      priorityIssues: JSON.parse(JSON.stringify(insightData.priorityIssues)),
      domainScores: JSON.parse(JSON.stringify(insightData.domainScores)),
      riskLevel: insightData.riskLevel,
      recommendations: JSON.parse(JSON.stringify(insightData.recommendations)),
      strengths: insightData.strengths,
    },
  });

  return NextResponse.json({
    insight: {
      id: created.id,
      summary: created.summary,
      detailedAnalysis: isPremium ? created.detailedAnalysis : null,
      priorityIssues: isPremium
        ? created.priorityIssues
        : (created.priorityIssues as Array<Record<string, unknown>>).map((issue, i) => ({
            title: i === 0 ? issue.title : "🔒 Premium",
            severity: issue.severity,
            description: i === 0 ? issue.description : "Upgrade ke Premium untuk melihat detail.",
            recommendation: i === 0 ? issue.recommendation : "🔒",
          })),
      domainScores: created.domainScores,
      riskLevel: created.riskLevel,
      recommendations: isPremium
        ? created.recommendations
        : (created.recommendations as Array<Record<string, unknown>>).filter(
            (r) => !r.isPremium
          ),
      strengths: created.strengths,
      isPremium,
    },
  });
}
