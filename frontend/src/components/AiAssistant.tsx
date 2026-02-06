import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Send, Bot, Loader2, Sparkles, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AiAssistant() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I can answer questions about your inventory, products, suppliers, and orders. How can I help?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsLoading(true)

    try {
      const data = await api.post<{ response: string }>('/api/ai/chat', { message: userMsg })
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err: any) {
      console.error('AI Chat Error:', err)
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please ensure backend is running.` }])
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <>
      {/* Floating Toggle Button */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}>
        <Button
          className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all hover:scale-110 ring-2 ring-white/10"
          onClick={() => setIsOpen(true)}
        >
          <Sparkles className="h-8 w-8 animate-pulse" />
        </Button>
      </div>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-96 z-50 transition-all duration-500 ease-in-out origin-bottom-right ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none'}`}>
        <Card className="border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl ring-1 ring-white/10">
          
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-white/5 flex flex-row items-center justify-between space-y-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-500 to-indigo-500 p-2 rounded-lg shadow-lg shadow-blue-500/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-white text-sm font-semibold tracking-wide">AI Assistant</CardTitle>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-full" onClick={() => setIsOpen(false)}>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="p-0 relative">
            <div className="h-[400px] p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 bg-gradient-to-b from-slate-900/50 to-slate-900/0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="mt-1 h-8 w-8 min-w-[2rem] rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed shadow-sm ${
                      msg.role === 'assistant'
                        ? 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-900/20'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="mt-1 h-8 w-8 min-w-[2rem] rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 h-10 w-16">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </CardContent>

          {/* Input Area */}
          <CardFooter className="p-3 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
            <form onSubmit={handleSubmit} className="flex w-full gap-2 items-center relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 rounded-full pl-4 pr-12 py-5 shadow-inner"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isLoading} 
                className="absolute right-1.5 top-1.5 h-7 w-7 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:bg-slate-700"
              >
                <div className={isLoading ? 'animate-spin' : ''}>
                   {isLoading ? <Loader2 className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5 translate-x-px translate-y-px" />}
                </div>
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
