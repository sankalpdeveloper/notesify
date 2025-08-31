"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import ProtectedRoute from "@/src/components/ProtectedRoute";

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

interface NotesResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export default function Notes() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", tagIds: [] as number[] });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchTags();
    }
  }, [user, searchTerm, selectedTagId]);

  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: user.id.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTagId && { tagId: selectedTagId.toString() })
      });

      const response = await fetch(`/api/notes?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      
      const data: NotesResponse = await response.json();
      setNotes(data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/tags?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      
      const data = await response.json();
      setTags(data);
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  };

  const createNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      setCreating(true);
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newNote,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const createdNote = await response.json();
      setNotes([createdNote, ...notes]);
      setNewNote({ title: "", content: "", tagIds: [] });
      setShowNewNoteForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setCreating(false);
    }
  };

  const deleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`/api/notes/${noteId}?userId=${user?.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredNotes = notes;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
              <p className="text-gray-600">Manage and organize your notes.</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Dashboard
              </Link>
              <button
                onClick={() => setShowNewNoteForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Note
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search notes
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="tagFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by tag
              </label>
              <select
                id="tagFilter"
                value={selectedTagId || ""}
                onChange={(e) => setSelectedTagId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All tags</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* New Note Form */}
        {showNewNoteForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Note</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  id="title"
                  placeholder="Enter note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  id="content"
                  rows={4}
                  placeholder="Enter note content..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <label key={tag.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newNote.tagIds.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNote({ ...newNote, tagIds: [...newNote.tagIds, tag.id] });
                          } else {
                            setNewNote({ ...newNote, tagIds: newNote.tagIds.filter(id => id !== tag.id) });
                          }
                        }}
                        className="mr-2"
                      />
                      <span
                        className="px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800"
                        style={tag.color ? { backgroundColor: tag.color + "20", color: tag.color } : {}}
                      >
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createNote}
                  disabled={creating || !newNote.content.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Note"}
                </button>
                <button
                  onClick={() => {
                    setShowNewNoteForm(false);
                    setNewNote({ title: "", content: "", tagIds: [] });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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

        {/* Notes Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notes...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedTagId ? "Try adjusting your filters." : "Get started by creating your first note."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div key={note.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {note.title || "Untitled"}
                  </h3>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-gray-400 hover:text-red-600 ml-2"
                    title="Delete note"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {note.content}
                </p>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {note.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        style={tag.color ? { backgroundColor: tag.color + "20", color: tag.color } : {}}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Updated {formatDate(note.updatedAt)}</span>
                  <Link
                    href={`/notes/${note.id}`}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      </div>
    </ProtectedRoute>
  );
}
