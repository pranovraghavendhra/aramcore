import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

const STATE_COLORS = {
  READY:      "#f59e0b",
  RUNNING:    "#10b981",
  TERMINATED: "#ef4444",
};

const API = "http://localhost:8000";
const WS  = "ws://localhost:8000/ws";

export default function App() {
  const [events, setEvents]       = useState([]);
  const [procs, setProcs]         = useState({});
  const [memHistory, setMemHistory] = useState([]);
  const [connected, setConnected] = useState(false);

  function applyEvent(evt, map) {
    const m = { ...map };
    if(evt.name)
      m[evt.pid] = { pid: evt.pid, name: evt.name, state: evt.state || m[evt.pid]?.state || "" };
    return m;
  }

  useEffect(() => {
    fetch(`${API}/events`)
      .then(r => r.json())
      .then(data => {
        setEvents(data.events);
        let m = {};
        let mem = [];
        data.events.forEach(e => {
          m = applyEvent(e, m);
          if(e.used !== "0" || e.type === "MEM_INIT")
            mem.push({ time: e.timestamp?.slice(11,19), used: parseInt(e.used) });
        });
        setProcs(m);
        setMemHistory(mem);
      });
  }, []);

  useEffect(() => {
    const ws = new WebSocket(WS);
    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (msg) => {
      const evt = JSON.parse(msg.data);
      setEvents(prev => [...prev.slice(-199), evt]);
      setProcs(prev => applyEvent(evt, prev));
      if(evt.used !== undefined)
        setMemHistory(prev => [...prev.slice(-49), { time: evt.timestamp?.slice(11,19), used: parseInt(evt.used) }]);
    };
    return () => ws.close();
  }, []);

  const procList  = Object.values(procs);
  const chartData = [
    { name: "READY",      count: procList.filter(p => p.state === "READY").length },
    { name: "RUNNING",    count: procList.filter(p => p.state === "RUNNING").length },
    { name: "TERMINATED", count: procList.filter(p => p.state === "TERMINATED").length },
  ];
  const currentMem = memHistory.length ? memHistory[memHistory.length-1].used : 0;

  return (
    <div style={{ background:"#0f172a", minHeight:"100vh", color:"#e2e8f0", fontFamily:"monospace", padding:"24px" }}>

      {/* header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
        <div>
          <h1 style={{ margin:0, fontSize:"22px", color:"#a78bfa" }}>அறம் கோர் — AramCore</h1>
          <p style={{ margin:0, fontSize:"12px", color:"#64748b" }}>observable x86 kernel dashboard</p>
        </div>
        <span style={{ fontSize:"12px", padding:"4px 12px", borderRadius:"999px", background:connected?"#064e3b":"#450a0a", color:connected?"#10b981":"#ef4444" }}>
          {connected ? "● live" : "○ disconnected"}
        </span>
      </div>

      {/* stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"24px" }}>
        {chartData.map(d => (
          <div key={d.name} style={{ background:"#1e293b", borderRadius:"12px", padding:"16px", borderLeft:`3px solid ${STATE_COLORS[d.name]}` }}>
            <p style={{ margin:0, fontSize:"11px", color:"#64748b" }}>{d.name}</p>
            <p style={{ margin:0, fontSize:"28px", fontWeight:"bold", color:STATE_COLORS[d.name] }}>{d.count}</p>
          </div>
        ))}
        <div style={{ background:"#1e293b", borderRadius:"12px", padding:"16px", borderLeft:"3px solid #6366f1" }}>
          <p style={{ margin:0, fontSize:"11px", color:"#64748b" }}>MEMORY USED</p>
          <p style={{ margin:0, fontSize:"28px", fontWeight:"bold", color:"#6366f1" }}>{(currentMem/1024).toFixed(1)}KB</p>
        </div>
      </div>

      {/* charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"24px" }}>
        <div style={{ background:"#1e293b", borderRadius:"12px", padding:"16px" }}>
          <p style={{ margin:"0 0 12px", fontSize:"12px", color:"#64748b" }}>process state distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:"#64748b", fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid #334155", borderRadius:"8px", color:"#e2e8f0" }}/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {chartData.map(d => <Cell key={d.name} fill={STATE_COLORS[d.name]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:"#1e293b", borderRadius:"12px", padding:"16px" }}>
          <p style={{ margin:"0 0 12px", fontSize:"12px", color:"#64748b" }}>memory usage over time (bytes)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={memHistory}>
              <XAxis dataKey="time" tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid #334155", borderRadius:"8px", color:"#e2e8f0" }}/>
              <Area type="monotone" dataKey="used" stroke="#6366f1" fill="#6366f133" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* process table */}
      <div style={{ background:"#1e293b", borderRadius:"12px", padding:"16px", marginBottom:"24px" }}>
        <p style={{ margin:"0 0 12px", fontSize:"12px", color:"#64748b" }}>active processes</p>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
          <thead>
            <tr style={{ color:"#475569" }}>
              <th style={{ textAlign:"left", padding:"6px 0" }}>PID</th>
              <th style={{ textAlign:"left", padding:"6px 0" }}>NAME</th>
              <th style={{ textAlign:"left", padding:"6px 0" }}>STATE</th>
            </tr>
          </thead>
          <tbody>
            {procList.map(p => (
              <tr key={p.pid} style={{ borderTop:"1px solid #0f172a" }}>
                <td style={{ padding:"8px 0", color:"#94a3b8" }}>{p.pid}</td>
                <td style={{ padding:"8px 0" }}>{p.name}</td>
                <td style={{ padding:"8px 0" }}>
                  <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"999px", background:(STATE_COLORS[p.state]||"#6366f1")+"22", color:STATE_COLORS[p.state]||"#6366f1" }}>
                    {p.state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* event log */}
      <div style={{ background:"#1e293b", borderRadius:"12px", padding:"16px" }}>
        <p style={{ margin:"0 0 12px", fontSize:"12px", color:"#64748b" }}>kernel event log</p>
        <div style={{ maxHeight:"240px", overflowY:"auto" }}>
          {[...events].reverse().map((e,i) => (
            <div key={i} style={{ fontSize:"12px", padding:"4px 0", borderBottom:"1px solid #0f172a", display:"flex", gap:"12px" }}>
              <span style={{ color:"#475569", minWidth:"80px" }}>{e.timestamp?.slice(11,19)}</span>
              <span style={{ color:"#a78bfa", minWidth:"160px" }}>{e.type}</span>
              <span style={{ color:"#94a3b8" }}>
                {e.name && `${e.name} (pid ${e.pid})`}
                {e.used !== "0" && e.used && ` — mem ${(parseInt(e.used)/1024).toFixed(1)}KB`}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}