import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { notes, noteTags } from "@/src/db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";
import { getAuthUser } from "@/src/lib/auth";

// GET - Fetch all notes for a user
export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tagId = searchParams.get("tagId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(notes.userId, authUser.userId)];
    
    if (search) {
      conditions.push(ilike(notes.content, `%${search}%`));
    }
    
    const whereConditions = conditions.length === 1 ? conditions[0] : and(...conditions);

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
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, content, tagIds } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Create the note
    const newNote = await db.insert(notes).values({
      title: title || null,
      content,
      userId: authUser.userId
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
