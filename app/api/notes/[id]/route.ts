import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db/client";
import { notes, noteTags } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/src/lib/auth";

// GET - Fetch a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id);
    
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, authUser.userId)
      ),
      with: {
        noteTags: {
          with: {
            tag: true
          }
        }
      }
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const formattedNote = {
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
    };

    return NextResponse.json(formattedNote);
  } catch (error) {
    console.error("Get note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id);
    
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

    // Update the note
    const updatedNote = await db
      .update(notes)
      .set({
        title: title || null,
        content,
        updatedAt: new Date()
      })
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, authUser.userId)
      ))
      .returning();

    if (updatedNote.length === 0) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
    }

    // Update tags
    if (tagIds !== undefined) {
      // Remove existing tags
      await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
      
      // Add new tags
      if (tagIds.length > 0) {
        const noteTagsData = tagIds.map((tagId: number) => ({
          noteId,
          tagId
        }));
        
        await db.insert(noteTags).values(noteTagsData);
      }
    }

    // Fetch the updated note with tags
    const note = await db.query.notes.findFirst({
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
      id: note!.id,
      title: note!.title || "Untitled",
      content: note!.content,
      createdAt: note!.createdAt,
      updatedAt: note!.updatedAt,
      tags: note!.noteTags.map(nt => ({
        id: nt.tag.id,
        name: nt.tag.name,
        color: nt.tag.color
      }))
    };

    return NextResponse.json(formattedNote);
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const noteId = parseInt(id);
    
    // Get user from cookie
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the note (tags will be deleted due to cascade)
    const deletedNote = await db
      .delete(notes)
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, authUser.userId)
      ))
      .returning();

    if (deletedNote.length === 0) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
