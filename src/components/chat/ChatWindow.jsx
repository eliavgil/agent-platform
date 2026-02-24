import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, X, Download, File } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getMessages, sendMessage, subscribeToMessages, uploadFile } from '../../lib/supabase'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'היום'
  if (date.toDateString() === yesterday.toDateString()) return 'אתמול'
  return date.toLocaleDateString('he-IL')
}

function MessageBubble({ message, isOwn }) {
  if (message.is_system) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 text-xs text-dark-400 bg-dark-800 rounded-full border border-dark-600">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <Avatar
          name={message.profiles?.full_name || '?'}
          avatarUrl={message.profiles?.avatar_url}
          size="xs"
          className="mb-1"
        />
      )}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs text-dark-400 mb-1 px-1">
            {message.profiles?.full_name}
          </span>
        )}
        <div className={`
          rounded-2xl px-4 py-2.5 text-sm
          ${isOwn
            ? 'bg-accent text-white rounded-bl-md'
            : 'bg-dark-700 text-gray-200 rounded-br-md'
          }
        `}>
          {message.content && <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>}
          {message.file_url && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 mt-1 p-2 rounded-lg ${
                isOwn ? 'bg-white/10 hover:bg-white/20' : 'bg-dark-600 hover:bg-dark-500'
              } transition-colors`}
            >
              <File size={14} className="flex-shrink-0" />
              <span className="text-xs truncate max-w-[180px]">{message.file_name || 'קובץ'}</span>
              <Download size={12} className="flex-shrink-0 mr-auto" />
            </a>
          )}
        </div>
        <span className={`text-xs text-dark-500 mt-1 px-1 ${isOwn ? 'text-left' : 'text-right'}`}>
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}

export default function ChatWindow({ requestId, disabled = false, placeholder = 'כתוב הודעה...' }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!requestId) return
    loadMessages()

    const channel = subscribeToMessages(requestId, (payload) => {
      if (payload.eventType === 'INSERT') {
        // Fetch the full message with profile
        loadMessages()
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [requestId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    const { data, error } = await getMessages(requestId)
    if (!error) setMessages(data || [])
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || sending) return

    setSending(true)
    try {
      let fileUrl = null
      let fileName = null
      let fileType = null

      if (selectedFile) {
        setUploadingFile(true)
        try {
          const path = `${requestId}/${Date.now()}-${selectedFile.name}`
          const result = await uploadFile('message-files', selectedFile, path)
          fileUrl = result.url
          fileName = selectedFile.name
          fileType = selectedFile.type
        } catch (uploadErr) {
          console.warn('File upload failed, sending message without file:', uploadErr)
        }
        setUploadingFile(false)
      }

      await sendMessage({
        request_id: requestId,
        sender_id: user.id,
        content: newMessage.trim() || null,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
      })

      setNewMessage('')
      setSelectedFile(null)
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = formatDate(msg.created_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-700 flex items-center justify-center mb-3">
              <Send size={20} className="text-dark-400" />
            </div>
            <p className="text-sm text-dark-400">אין הודעות עדיין</p>
            <p className="text-xs text-dark-500 mt-1">התחל שיחה עם {profile?.role === 'teacher' ? 'הסוכן' : 'המורה'}</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <span className="px-3 py-0.5 text-xs text-dark-400 bg-dark-800 rounded-full border border-dark-600">
                  {date}
                </span>
              </div>
              {dateMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!disabled && (
        <div className="border-t border-dark-700 px-4 py-3">
          {selectedFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-dark-700 rounded-lg text-sm">
              <File size={14} className="text-accent flex-shrink-0" />
              <span className="text-dark-200 truncate flex-1">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="text-dark-400 hover:text-danger flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-gray-200 transition-colors flex-shrink-0"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-dark-700 border border-dark-600 text-gray-100 rounded-xl px-4 py-2.5 text-sm
                placeholder:text-dark-500 focus:outline-none focus:border-accent/50 resize-none
                min-h-[44px] max-h-[120px]"
              style={{ overflowY: 'auto' }}
            />
            <Button
              type="submit"
              size="md"
              loading={sending || uploadingFile}
              disabled={!newMessage.trim() && !selectedFile}
              className="flex-shrink-0"
              icon={<Send size={16} />}
            >
              שלח
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
