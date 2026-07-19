"use client";

export function VideoCall({
  roomName,
  displayName,
}: {
  roomName: string;
  displayName: string;
}) {
  // Jitsi Meet embedded via iframe. Display name + skip prejoin via URL hash.
  const hash =
    `#config.prejoinPageEnabled=false` +
    `&userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName))}`;
  const src = `https://meet.jit.si/${roomName}${hash}`;

  return (
    <iframe
      src={src}
      allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
      className="w-full h-full min-h-[70vh] rounded-2xl border border-sand-200"
      title="Video Call"
    />
  );
}
