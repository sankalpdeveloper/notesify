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

// PUT - Update a tag
export async function PUT(request: NextRequest) {
  try {
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, name, color } = body;

    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }

    // Check if tag exists and belongs to user
    const existingTag = await db.query.tags.findFirst({
      where: and(eq(tags.id, id), eq(tags.userId, authUser.userId))
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check if another tag with same name already exists for this user
    const duplicateTag = await db.query.tags.findFirst({
      where: and(
        eq(tags.name, name), 
        eq(tags.userId, authUser.userId),
        // Exclude current tag from check
        // Note: This is a simplified check, in production you'd use neq
      )
    });

    if (duplicateTag && duplicateTag.id !== id) {
      return NextResponse.json({ error: "Tag with this name already exists" }, { status: 409 });
    }

    const updatedTag = await db
      .update(tags)
      .set({
        name,
        color: color || null,
        updatedAt: new Date()
      })
      .where(and(eq(tags.id, id), eq(tags.userId, authUser.userId)))
      .returning();

    return NextResponse.json(updatedTag[0]);
  } catch (error) {
    console.error("Update tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("id");

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID is required" }, { status: 400 });
    }

    // Check if tag exists and belongs to user
    const existingTag = await db.query.tags.findFirst({
      where: and(eq(tags.id, parseInt(tagId)), eq(tags.userId, authUser.userId))
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Delete the tag (noteTags will be deleted due to cascade)
    await db
      .delete(tags)
      .where(and(eq(tags.id, parseInt(tagId)), eq(tags.userId, authUser.userId)));

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
