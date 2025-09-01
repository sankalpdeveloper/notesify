"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Tag {
  id: number;
  name: string;
  color?: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

interface NoteEditPageProps {
  params: {
    id: string;
  };
}

export default function NoteEditPage({ params }: NoteEditPageProps) {
  const router = useRouter();
  const noteId = parseInt(params.id);
  
  const [note, setNote] = useState<Note | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedNote, setEditedNote] = useState({
    title: "",
    content: "",
    tagIds: [] as number[]
  });

  useEffect(() => {
    fetchNote();
    fetchTags();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notes/${noteId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Note not found");
        } else {
          throw new Error("Failed to fetch note");
        }
        return;
      }
      
      const data = await response.json();
      setNote(data);
      setEditedNote({
        title: data.title || "",
        content: data.content,
        tagIds: data.tags.map((tag: Tag) => tag.id)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`/api/tags`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      
      const data = await response.json();
      setTags(data);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  };

  const saveNote = async () => {
    if (!editedNote.content.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editedNote
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const updatedNote = await response.json();
      setNote(updatedNote);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      router.push("/notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            {/* Outer ring */}
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin border-t-blue-600"></div>
            {/* Inner ring */}
            <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-t-blue-400" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Note</h3>
            <p className="text-gray-600">Please wait while we fetch your note...</p>
          </div>
          {/* Progress dots */}
          <div className="flex justify-center space-x-1 mt-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/notes"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/notes"
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Note</h1>
                {note && (
                  <p className="text-sm text-gray-500">
                    Created {formatDate(note.createdAt)} • Last updated {formatDate(note.updatedAt)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={deleteNote}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <button
                onClick={saveNote}
                disabled={saving || !editedNote.content.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                placeholder="Enter note title (optional)"
                value={editedNote.title}
                onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                id="content"
                rows={15}
                placeholder="Enter note content..."
                value={editedNote.content}
                onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">No tags available. Create some tags first!</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tags.map((tag) => (
                    <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedNote.tagIds.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditedNote({ ...editedNote, tagIds: [...editedNote.tagIds, tag.id] });
                          } else {
                            setEditedNote({ ...editedNote, tagIds: editedNote.tagIds.filter(id => id !== tag.id) });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span
                        className="px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800 flex-1"
                        style={tag.color ? { backgroundColor: tag.color + "20", color: tag.color } : {}}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-save indicator */}
        {note && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Last saved: {formatDate(note.updatedAt)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
