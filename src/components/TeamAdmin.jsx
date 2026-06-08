import { useState, useEffect } from 'react'
import '../styles/TeamAdmin.css'

const AVATARS = [
  '🎭', '🦸', '🧑‍🚀', '🐱', '🐹', '🦊', '🦖', '🐙', '🦉', '🐢',
  '🦄', '🧙', '🎪', '🚀', '⚡', '🎸', '🐺', '🦅', '🐉', '🧛'
]

export default function TeamAdmin({ teamRoster, onSave, onBack }) {
  const [members, setMembers] = useState(teamRoster)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({ name: '', avatar: '', clues: '' })
  const [showForm, setShowForm] = useState(false)

  const startAdd = () => {
    setEditingId(null)
    setFormData({ name: '', avatar: '🎭', clues: '' })
    setShowForm(true)
  }

  const startEdit = (member) => {
    setEditingId(member.id)
    setFormData({
      name: member.name,
      avatar: member.avatar,
      clues: member.guessTheCoworker?.clues?.join('\n') || ''
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!formData.name.trim() || !formData.avatar) {
      alert('Name and avatar are required')
      return
    }

    const cluesArray = formData.clues
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0)

    if (editingId === null) {
      // Add new member
      const newMember = {
        id: `member-${Date.now()}`,
        name: formData.name,
        avatar: formData.avatar,
        status: 'active',
        guessTheCoworker: { clues: cluesArray }
      }
      setMembers([...members, newMember])
    } else {
      // Edit existing member
      setMembers(members.map(m =>
        m.id === editingId
          ? {
              ...m,
              name: formData.name,
              avatar: formData.avatar,
              guessTheCoworker: { clues: cluesArray }
            }
          : m
      ))
    }

    setShowForm(false)
    setFormData({ name: '', avatar: '', clues: '' })
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this team member?')) {
      setMembers(members.filter(m => m.id !== id))
    }
  }

  const handleSaveAll = () => {
    onSave(members)
    alert('Team roster saved!')
  }

  return (
    <div className="team-admin-container">
      <div className="admin-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>👥 Manage Team Roster</h1>
      </div>

      <div className="admin-content">
        {/* Member List */}
        <div className="members-section">
          <div className="section-header">
            <h2>Team Members ({members.length})</h2>
            <button className="btn-add" onClick={startAdd}>+ Add Member</button>
          </div>

          {members.length === 0 ? (
            <p className="empty-message">No team members yet. Add your first member!</p>
          ) : (
            <div className="members-list">
              {members.map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-info">
                    <div className="member-avatar">{member.avatar}</div>
                    <div className="member-details">
                      <h3>{member.name}</h3>
                      <p className="clue-count">
                        {member.guessTheCoworker?.clues?.length || 0} clues
                      </p>
                    </div>
                  </div>
                  <div className="member-actions">
                    <button
                      className="btn-edit"
                      onClick={() => startEdit(member)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(member.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="form-section">
            <h2>{editingId === null ? 'Add New Member' : 'Edit Member'}</h2>

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chris Durso"
              />
            </div>

            <div className="form-group">
              <label>Avatar *</label>
              <div className="avatar-picker">
                {AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    className={`avatar-option ${formData.avatar === avatar ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, avatar })}
                    title={avatar}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Personalized Clues (one per line)</label>
              <textarea
                value={formData.clues}
                onChange={(e) => setFormData({ ...formData, clues: e.target.value })}
                placeholder="Titanic lore connoisseur&#10;Owns a Discord server with 20K users&#10;Makes leather props"
                rows={8}
              />
              <p className="hint">Enter one clue per line. Leave empty to use default clues for this member.</p>
            </div>

            <div className="form-actions">
              <button className="btn-save" onClick={handleSave}>
                Save Member
              </button>
              <button className="btn-cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Save All Button */}
        {!showForm && members.length > 0 && (
          <div className="save-all-section">
            <button className="btn-primary" onClick={handleSaveAll}>
              💾 Save All Changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
