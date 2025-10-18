import React, { useState, useEffect, useRef } from 'react'

function useSpeech() {
  const synth = typeof window !== 'undefined' && window.speechSynthesis
  return {
    speak: (text) => {
      if (!synth) return
      const u = new SpeechSynthesisUtterance(text)
      synth.cancel()
      synth.speak(u)
    }
  }
}

export default function App(){
  const [mood, setMood] = useState('relajado')
  const [genre, setGenre] = useState('comedia')
  const [thinkLevel, setThinkLevel] = useState('baja')
  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState([])
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const speech = useSpeech()
  const chatRef = useRef(null)

  useEffect(()=> {
    if(chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  },[chatHistory])

  async function getRecommendations(e){
    e && e.preventDefault()
    setLoading(true)
    try {
      const body = { mood, genre, thinkLevel, meta:{source:'vercel_frontend'} }
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      setRecs(data.recommendations || [])
    } catch(err){
      console.error(err)
      setRecs([{ title: 'Error', synopsis: 'No se pudo obtener recomendaciones. Revisa el webhook.' }])
    }
    setLoading(false)
  }

  async function sendChat(){
    if(!chatInput.trim()) return
    const userMsg = { role:'user', text: chatInput }
    setChatHistory(h => [...h, userMsg])
    setChatInput('')
    try {
      const res = await fetch('/api/recommendations?type=chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ chat: [...chatHistory, userMsg] })
      })
      const data = await res.json()
      const bot = { role:'bot', text: data.answer || 'No tengo respuesta ahora mismo.' }
      setChatHistory(h => [...h, bot])
      speech.speak(bot.text)
    } catch(err){
      console.error(err)
      const bot = { role:'bot', text:'Error conectando con el servidor de chat.' }
      setChatHistory(h => [...h, bot])
    }
  }

  return (
    <div className="app">
      <header>
        <h1>VibeRecs — recomendaciones</h1>
        <p className="tag">Elige tu estado de ánimo y te propongo pelis/series.</p>
      </header>

      <main>
        <section className="controls">
          <form onSubmit={getRecommendations}>
            <label>Mood
              <select value={mood} onChange={e=>setMood(e.target.value)}>
                <option value="relajado">Relajado</option>
                <option value="nostalgico">Nostálgico</option>
                <option value="estresado">Estresado</option>
                <option value="valiente">Valiente</option>
              </select>
            </label>

            <label>Género
              <select value={genre} onChange={e=>setGenre(e.target.value)}>
                <option>comedia</option>
                <option>drama</option>
                <option>thriller</option>
                <option>documental</option>
                <option>acción</option>
              </select>
            </label>

            <label>Ganas de pensar
              <select value={thinkLevel} onChange={e=>setThinkLevel(e.target.value)}>
                <option value="baja">Relajarse / distraerse</option>
                <option value="media">Ligeramente intelectual</option>
                <option value="alta">Quiero pensar</option>
              </select>
            </label>

            <div className="actions">
              <button type="submit" disabled={loading}>{loading? 'Buscando...':'Recomiéndame'}</button>
              <button type="button" onClick={()=>{
                setMood('relajado'); setGenre('comedia'); setThinkLevel('baja')
              }}>Reset</button>
            </div>
          </form>
        </section>

        <section className="results">
          <h2>Recomendaciones</h2>
          {recs.length === 0 && <p>No hay recomendaciones aún — pulsa "Recomiéndame".</p>}
          <ul>
            {recs.map((r, i)=>(
              <li key={i} className="rec">
                <h3>{r.title} <small>({r.type || 'película/serie'})</small></h3>
                <p className="synopsis">{r.synopsis}</p>
                {r.why && <p className="why"><strong>Por qué:</strong> {r.why}</p>}
                {r.link && <a href={r.link} target="_blank" rel="noreferrer">Más info</a>}
              </li>
            ))}
          </ul>
        </section>

        <section className="chat">
          <h2>Chat / Agente de voz</h2>
          <div ref={chatRef} className="chat-box">
            {chatHistory.map((m, i)=>(
              <div key={i} className={`bubble ${m.role}`}>
                <div className="txt">{m.text}</div>
              </div>
            ))}
          </div>
          <div className="chat-controls">
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Pregúntame sobre una peli..." />
            <button onClick={sendChat}>Enviar</button>
            <button onClick={()=>speech.speak('Hola, dime en qué puedo ayudarte')}>Probar voz</button>
          </div>
        </section>
      </main>

      <footer>
        <small>Hecho con cariño.</small>
      </footer>
    </div>
  )
}
