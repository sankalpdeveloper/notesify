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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  My Notes
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {notes.length} {notes.length === 1 ? 'note' : 'notes'} • Welcome back, {user?.name}
                </p>
              </div>
            </div>
            
            {/* Mobile Actions */}
            <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 5v4" />
                  </svg>
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={() => setShowNewNoteForm(true)}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">New Note</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center p-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-white/50">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900 text-sm sm:text-base"
                />
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1 min-w-0">
                <select
                  id="tagFilter"
                  value={selectedTagId || ""}
                  onChange={(e) => setSelectedTagId(e.target.value ? parseInt(e.target.value) : null)}
                  className="appearance-none w-full bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                >
                  <option value="">All tags</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {(searchTerm || selectedTagId) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTagId(null);
                  }}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 whitespace-nowrap min-h-[42px] sm:min-h-[48px]"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden xs:inline">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* New Note Form */}
        {showNewNoteForm && (
          <div className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl border border-white/50 transition-all duration-300 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="h-3 w-3 sm:h-5 sm:w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Create New Note</h3>
              </div>
              <button
                onClick={() => {
                  setShowNewNoteForm(false);
                  setNewNote({ title: "", content: "", tagIds: [] });
                }}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  placeholder="Give your note a title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-gray-900 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  rows={4}
                  placeholder="What's on your mind?"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 resize-none text-gray-900 text-sm sm:text-base min-h-[120px] sm:min-h-[150px]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Tags
                </label>
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No tags available. Create some tags first!</p>
                ) : (
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center space-x-2 cursor-pointer group p-2 rounded-lg hover:bg-gray-50/50 transition-all duration-200">
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
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all duration-200 flex-shrink-0"
                        />
                        <span
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 group-hover:scale-105 flex-1 min-w-0 truncate ${
                            newNote.tagIds.includes(tag.id)
                              ? 'ring-2 ring-blue-500/20 shadow-md'
                              : ''
                          }`}
                          style={tag.color 
                            ? { 
                                backgroundColor: tag.color + "15", 
                                color: tag.color,
                                borderLeft: `3px solid ${tag.color}`
                              } 
                            : { backgroundColor: '#f3f4f6', color: '#374151' }
                          }
                        >
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowNewNoteForm(false);
                    setNewNote({ title: "", content: "", tagIds: [] });
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={createNote}
                  disabled={creating || !newNote.content.trim()}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none order-1 sm:order-2"
                >
                  {creating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Create Note</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-red-800">Something went wrong</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Notes Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Loading your notes</h3>
                <p className="text-gray-500">Please wait while we fetch your content...</p>
              </div>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {searchTerm || selectedTagId ? "No matching notes" : "No notes yet"}
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {searchTerm || selectedTagId 
                    ? "Try adjusting your search or filter criteria to find what you're looking for." 
                    : "Start capturing your thoughts and ideas by creating your first note."
                  }
                </p>
                {!searchTerm && !selectedTagId && (
                  <button
                    onClick={() => setShowNewNoteForm(true)}
                    className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Note
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredNotes.map((note, index) => (
              <div 
                key={note.id} 
                className="group bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-white/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                      {note.title || "Untitled Note"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-3">
                    <Link
                      href={`/notes/${note.id}`}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 opacity-80 sm:opacity-0 group-hover:opacity-100 touch-manipulation"
                      title="Edit note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-80 sm:opacity-0 group-hover:opacity-100 touch-manipulation"
                      title="Delete note"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mb-3 sm:mb-4">
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 sm:line-clamp-4">
                    {note.content}
                  </p>
                </div>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    {note.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ring-1 ring-inset transition-all duration-200 hover:scale-105"
                        style={tag.color 
                          ? { 
                              backgroundColor: tag.color + "15", 
                              color: tag.color,
                              borderColor: tag.color + "30"
                            } 
                          : { 
                              backgroundColor: '#f3f4f6', 
                              color: '#6b7280',
                              borderColor: '#e5e7eb'
                            }
                        }
                      >
                        {tag.name}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{formatDate(note.updatedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium hidden xs:inline">Saved</span>
                  </div>
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
