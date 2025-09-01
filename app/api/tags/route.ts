import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { tags } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/src/lib/auth";

// GET - Fetch all tags for a user
export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTags = await db.query.tags.findMany({
      where: eq(tags.userId, authUser.userId),
      orderBy: [tags.name]
    });

    return NextResponse.json(userTags);
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new tag
export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if tag with same name already exists for this user
    const existingTag = await db.query.tags.findFirst({
      where: and(eq(tags.name, name), eq(tags.userId, authUser.userId))
    });

    if (existingTag) {
      return NextResponse.json({ error: "Tag with this name already exists" }, { status: 409 });
    }

    const newTag = await db.insert(tags).values({
      name,
      color: color || null,
      userId: authUser.userId
    }).returning();

    return NextResponse.json(newTag[0], { status: 201 });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
