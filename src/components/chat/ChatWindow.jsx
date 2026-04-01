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

function MessageBubble({ message, isOwn, light }) {
  if (message.is_system) {
    return (
      <div className="flex justify-center my-2">
        <span className={`px-3 py-1 text-xs rounded-full border ${
          light
            ? 'text-gray-400 bg-gray-100 border-gray-200'
            : 'text-dark-400 bg-dark-800 border-dark-600'
        }`}>
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
          <span className={`text-xs mb-1 px-1 ${light ? 'text-gray-400' : 'text-dark-400'}`}>
            {message.profiles?.full_name}
          </span>
        )}
        <div className={`
          rounded-2xl px-4 py-2.5 text-sm
          ${isOwn
            ? 'bg-accent text-white rounded-bl-md'
            : light
              ? 'bg-gray-100 text-gray-800 rounded-br-md'
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
                isOwn
                  ? 'bg-white/10 hover:bg-white/20'
                  : light
                    ? 'bg-gray-200 hover:bg-gray-300'
                    : 'bg-dark-600 hover:bg-dark-500'
              } transition-colors`}
            >
              <File size={14} className="flex-shrink-0" />
              <span className="text-xs truncate max-w-[180px]">{message.file_name || 'קובץ'}</span>
              <Download size={12} className="flex-shrink-0 mr-auto" />
            </a>
          )}
        </div>
        <span className={`text-xs mt-1 px-1 ${isOwn ? 'text-left' : 'text-right'} ${light ? 'text-gray-400' : 'text-dark-500'}`}>
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  )
}

export default function ChatWindow({ requestId, disabled = false, placeholder = 'כתוב הודעה...', light = false }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!requestId) return
    loadMessages()

    const channel = subscribeToMessages(requestId, (payload) => {
      if (payload.eventType === 'INSERT') {
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
          const ext = selectedFile.name.includes('.') ? selectedFile.name.split('.').pop() : ''
          const path = `${requestId}/${Date.now()}${ext ? '.' + ext : ''}`
          const result = await uploadFile('message-files', selectedFile, path)
          fileUrl = result.url
          fileName = selectedFile.name
          fileType = selectedFile.type
        } catch (uploadErr) {
          console.warn('File upload failed:', uploadErr)
          setUploadError('העלאת הקובץ נכשלה. נסה שוב.')
          setUploadingFile(false)
          setSending(false)
          return
        }
        setUploadingFile(false)
      }

      setUploadError('')
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
      <div className={`flex-1 overflow-y-auto px-4 py-4 ${light ? 'bg-gray-50' : ''}`}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${light ? 'bg-gray-100' : 'bg-dark-700'}`}>
              <Send size={20} className={light ? 'text-gray-400' : 'text-dark-400'} />
            </div>
            <p className={`text-sm ${light ? 'text-gray-400' : 'text-dark-400'}`}>אין הודעות עדיין</p>
            <p className={`text-xs mt-1 ${light ? 'text-gray-400' : 'text-dark-500'}`}>התחל שיחה עם {profile?.role === 'teacher' ? 'הסוכן' : 'המורה'}</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <span className={`px-3 py-0.5 text-xs rounded-full border ${
                  light
                    ? 'text-gray-400 bg-gray-100 border-gray-200'
                    : 'text-dark-400 bg-dark-800 border-dark-600'
                }`}>
                  {date}
                </span>
              </div>
              {dateMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                  light={light}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!disabled && (
        <div className={`border-t px-4 py-3 ${light ? 'border-gray-200 bg-white' : 'border-dark-700'}`}>
          {uploadError && (
            <p className="text-xs text-danger mb-2 px-1">{uploadError}</p>
          )}
          {selectedFile && (
            <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-sm ${light ? 'bg-gray-100' : 'bg-dark-700'}`}>
              <File size={14} className="text-accent flex-shrink-0" />
              <span className={`truncate flex-1 ${light ? 'text-gray-700' : 'text-dark-200'}`}>{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className={`flex-shrink-0 ${light ? 'text-gray-400 hover:text-danger' : 'text-dark-400 hover:text-danger'}`}>
                <X size={14} />
              </button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setUploadError('') }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
                light
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700'
                  : 'bg-dark-700 hover:bg-dark-600 text-dark-400 hover:text-gray-200'
              }`}
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
              className={`flex-1 border rounded-xl px-4 py-2.5 text-sm
                focus:outline-none focus:border-accent/50 resize-none
                min-h-[44px] max-h-[120px] ${
                light
                  ? 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400'
                  : 'bg-dark-700 border-dark-600 text-gray-100 placeholder:text-dark-500'
              }`}
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
