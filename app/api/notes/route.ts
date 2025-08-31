import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { notes, noteTags } from "@/src/db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";

// GET - Fetch all notes for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const tagId = searchParams.get("tagId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userIdNum = parseInt(userId);
    
    // Build where conditions
    let whereConditions = eq(notes.userId, userIdNum);
    
    if (search) {
      whereConditions = and(
        whereConditions,
        ilike(notes.content, `%${search}%`)
      );
    }

    // Fetch notes with pagination
    const userNotes = await db.query.notes.findMany({
      where: whereConditions,
      orderBy: [desc(notes.updatedAt)],
      limit: limit,
      offset: offset,
      with: {
        noteTags: {
          with: {
            tag: true
          }
        }
      }
    });

    // Filter by tag if specified
    let filteredNotes = userNotes;
    if (tagId) {
      const tagIdNum = parseInt(tagId);
      filteredNotes = userNotes.filter(note => 
        note.noteTags.some(nt => nt.tag.id === tagIdNum)
      );
    }

    // Format response
    const formattedNotes = filteredNotes.map(note => ({
      id: note.id,
      title: note.title || "Untitled",
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      tags: note.noteTags.map(nt => ({
        id: nt.tag.id,
        name: nt.tag.name,
        color: nt.tag.color
      }))
    }));

    return NextResponse.json({
      notes: formattedNotes,
      pagination: {
        page,
        limit,
        hasMore: userNotes.length === limit
      }
    });
  } catch (error) {
    console.error("Get notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, userId, tagIds } = body;

    if (!content || !userId) {
      return NextResponse.json({ error: "Content and user ID are required" }, { status: 400 });
    }

    // Create the note
    const newNote = await db.insert(notes).values({
      title: title || null,
      content,
      userId: parseInt(userId)
    }).returning();

    const noteId = newNote[0].id;

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      const noteTagsData = tagIds.map((tagId: number) => ({
        noteId,
        tagId
      }));
      
      await db.insert(noteTags).values(noteTagsData);
    }

    // Fetch the created note with tags
    const createdNote = await db.query.notes.findFirst({
      where: eq(notes.id, noteId),
      with: {
        noteTags: {
          with: {
            tag: true
          }
        }
      }
    });

    const formattedNote = {
      id: createdNote!.id,
      title: createdNote!.title || "Untitled",
      content: createdNote!.content,
      createdAt: createdNote!.createdAt,
      updatedAt: createdNote!.updatedAt,
      tags: createdNote!.noteTags.map(nt => ({
        id: nt.tag.id,
        name: nt.tag.name,
        color: nt.tag.color
      }))
    };

    return NextResponse.json(formattedNote, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
