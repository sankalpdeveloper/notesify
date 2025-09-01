import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { notes, tags } from "@/src/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { getAuthUser } from "@/src/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId =authUser.userId;

    // Get total notes count
    const totalNotesResult = await db
      .select({ count: count() })
      .from(notes)
      .where(eq(notes.userId, userId));

    // Get total tags count
    const totalTagsResult = await db
      .select({ count: count() })
      .from(tags)
      .where(eq(tags.userId, userId));

    // Get recent notes (last 5)
    const recentNotes = await db.query.notes.findMany({
      where: eq(notes.userId, userId),
      orderBy: [desc(notes.updatedAt)],
      limit: 5,
      with: {
        noteTags: {
          with: {
            tag: true
          }
        }
      }
    });

    // Get notes created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentNotesCount = await db
      .select({ count: count() })
      .from(notes)
      .where(
        sql`${notes.userId} = ${userId} AND ${notes.createdAt} >= ${sevenDaysAgo}`
      );

    // Format recent notes
    const formattedRecentNotes = recentNotes.map(note => ({
      id: note.id,
      title: note.title || "Untitled",
      content: note.content.substring(0, 100) + (note.content.length > 100 ? "..." : ""),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      tags: note.noteTags.map(nt => ({
        id: nt.tag.id,
        name: nt.tag.name,
        color: nt.tag.color
      }))
    }));

    const dashboardData = {
      stats: {
        totalNotes: totalNotesResult[0].count,
        totalTags: totalTagsResult[0].count,
        recentNotesCount: recentNotesCount[0].count
      },
      recentNotes: formattedRecentNotes
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
