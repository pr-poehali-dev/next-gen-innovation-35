import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";

const VOICE_URL = "https://functions.poehali.dev/0958ddb3-2885-4c55-a299-38539aab2053";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type Peer = { username: string; stream?: MediaStream; muted: boolean };

interface VoiceChatProps {
  room: string;
  user: { id: number; username: string; avatar: string };
  token: string;
  onLeave: () => void;
}

export const VoiceChat = ({ room, user, token, onLeave }: VoiceChatProps) => {
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");

  const localStream = useRef<MediaStream | null>(null);
  const peerConns = useRef<Record<string, RTCPeerConnection>>({});
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const apiPost = useCallback(async (body: object) => {
    await fetch(VOICE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify(body),
    });
  }, [token]);

  const createPeerConn = useCallback((targetUsername: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    localStream.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStream.current!);
    });

    pc.onicecandidate = async (e) => {
      if (e.candidate) {
        await fetch(VOICE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Auth-Token": token },
          body: JSON.stringify({
            action: "signal", room, to: targetUsername,
            type: "ice", payload: e.candidate,
          }),
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setPeers(prev => ({ ...prev, [targetUsername]: { ...prev[targetUsername], stream } }));

      if (!audioRefs.current[targetUsername]) {
        const audio = new Audio();
        audio.autoplay = true;
        audioRefs.current[targetUsername] = audio;
      }
      audioRefs.current[targetUsername].srcObject = stream;
    };

    peerConns.current[targetUsername] = pc;
    return pc;
  }, [room, token]);

  const handleSignal = useCallback(async (sig: { from: string; type: string; payload: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
    const { from, type, payload } = sig;

    if (type === "joined") {
      // Новый боб зашёл — создаём offer
      if (from === user.username) return;
      setPeers(prev => ({ ...prev, [from]: { username: from, muted: false } }));
      const pc = createPeerConn(from);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await fetch(VOICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "signal", room, to: from, type: "offer", payload: offer }),
      });

    } else if (type === "left") {
      setPeers(prev => { const n = { ...prev }; delete n[from]; return n; });
      peerConns.current[from]?.close();
      delete peerConns.current[from];
      if (audioRefs.current[from]) {
        audioRefs.current[from].srcObject = null;
        delete audioRefs.current[from];
      }

    } else if (type === "offer") {
      let pc = peerConns.current[from];
      if (!pc) {
        pc = createPeerConn(from);
        setPeers(prev => ({ ...prev, [from]: { username: from, muted: false } }));
      }
      await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await fetch(VOICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "signal", room, to: from, type: "answer", payload: answer }),
      });

    } else if (type === "answer") {
      const pc = peerConns.current[from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));

    } else if (type === "ice") {
      const pc = peerConns.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
        } catch (err) {
          console.warn("ICE error", err);
        }
      }
    }
  }, [createPeerConn, room, token, user.username]);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${VOICE_URL}?action=poll&room=${encodeURIComponent(room)}`, {
        headers: { "X-Auth-Token": token },
      });
      const data = await res.json();
      for (const sig of data.signals || []) {
        await handleSignal(sig);
      }
    } catch (err) {
      console.warn("poll error", err);
    }
  }, [handleSignal, room, token]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        localStream.current = stream;
        setStatus("connected");

        await apiPost({ action: "join", room });

        pollTimer.current = setInterval(poll, 1500);
        heartbeatTimer.current = setInterval(() => apiPost({ action: "heartbeat" }), 30000);
      } catch (err) {
        console.error("voice init error", err);
        if (active) setStatus("error");
      }
    };

    init();

    return () => {
      active = false;
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, []);

  const leave = useCallback(async () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    localStream.current?.getTracks().forEach(t => t.stop());
    Object.values(peerConns.current).forEach(pc => pc.close());
    peerConns.current = {};
    Object.values(audioRefs.current).forEach(a => { a.srcObject = null; });
    audioRefs.current = {};
    await apiPost({ action: "leave", room });
    onLeave();
  }, [apiPost, onLeave, room]);

  const toggleMute = () => {
    const enabled = !muted;
    localStream.current?.getAudioTracks().forEach(t => { t.enabled = !enabled; });
    setMuted(enabled);
  };

  const toggleDeafen = () => {
    const d = !deafened;
    Object.values(audioRefs.current).forEach(a => { a.muted = d; });
    setDeafened(d);
  };

  if (status === "error") {
    return (
      <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 mx-2 mb-2">
        <p className="text-red-300 text-xs text-center">Нет доступа к микрофону 🦉</p>
        <button onClick={onLeave} className="text-red-400 hover:text-red-200 text-xs w-full text-center mt-1 underline">
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1e2124] border border-[#202225] rounded-lg mx-2 mb-2 overflow-hidden">
      {/* Хедер */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#36393f]">
        <div className="flex items-center gap-2">
          {status === "connecting" ? (
            <Loader className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          ) : (
            <div className="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse" />
          )}
          <span className="text-white text-xs font-semibold truncate">{room}</span>
        </div>
        <button onClick={leave} className="text-red-400 hover:text-red-300 transition-colors">
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>

      {/* Участники */}
      <div className="p-2 space-y-1">
        {/* Я */}
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-[#36393f]">
          <div className="relative">
            <div className="w-7 h-7 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-sm">
              {user.avatar}
            </div>
            {!muted && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 border-[#1e2124] rounded-full" />}
          </div>
          <span className="text-[#7c3aed] text-xs font-medium flex-1 truncate">{user.username}</span>
          {muted && <MicOff className="w-3 h-3 text-red-400" />}
        </div>

        {/* Остальные */}
        {Object.values(peers).map(p => (
          <div key={p.username} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#36393f] transition-colors">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm">
              🦉
            </div>
            <span className="text-white text-xs flex-1 truncate">{p.username}</span>
            <Volume2 className="w-3 h-3 text-[#3ba55c]" />
          </div>
        ))}

        {Object.keys(peers).length === 0 && status === "connected" && (
          <p className="text-[#72767d] text-xs text-center py-1">Ты один в норе... 🦉</p>
        )}
      </div>

      {/* Контролы */}
      <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-[#202225]">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleMute}
          className={`w-8 h-8 p-0 rounded-full ${muted ? "bg-red-900/50 hover:bg-red-900/70 text-red-400" : "hover:bg-[#40444b] text-[#b9bbbe]"}`}
        >
          {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleDeafen}
          className={`w-8 h-8 p-0 rounded-full ${deafened ? "bg-red-900/50 hover:bg-red-900/70 text-red-400" : "hover:bg-[#40444b] text-[#b9bbbe]"}`}
        >
          {deafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Button
          size="sm"
          onClick={leave}
          className="w-8 h-8 p-0 rounded-full bg-red-600 hover:bg-red-700 text-white"
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};