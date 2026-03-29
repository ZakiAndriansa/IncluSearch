import Link from "next/link";
import { ArrowLeft, Video, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";

interface ConsultationHeaderProps {
  consultation: {
    status: string;
    scheduledAt: Date;
    durationMins: number;
    videoCallUrl: string | null;
    parent: { id: string; name: string | null; image: string | null };
    expert: {
      profilePhotoUrl: string | null;
      user: { id: string; name: string | null; image: string | null };
    };
  };
  currentUserId: string;
}

const STATUS_MAP: Record<string, { label: string; dot: string }> = {
  SCHEDULED: { label: "Terjadwal", dot: "bg-blue-400" },
  IN_PROGRESS: { label: "Berlangsung", dot: "bg-green-400 animate-pulse" },
  COMPLETED: { label: "Selesai", dot: "bg-sand-400" },
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
}

export function ConsultationHeader({
  consultation,
  currentUserId,
}: ConsultationHeaderProps) {
  const isParent = consultation.parent.id === currentUserId;

  const otherName = isParent
    ? consultation.expert.user.name
    : consultation.parent.name;
  const otherImage = isParent
    ? (consultation.expert.profilePhotoUrl ?? consultation.expert.user.image)
    : consultation.parent.image;

  const statusInfo = STATUS_MAP[consultation.status] ?? {
    label: consultation.status,
    dot: "bg-sand-400",
  };

  const startTime = new Date(consultation.scheduledAt);
  const endTime = new Date(startTime.getTime() + consultation.durationMins * 60 * 1000);
  const timeRange = `${formatTime(startTime)} – ${formatTime(endTime)}`;
  const dateLabel = formatDateShort(startTime);

  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 bg-white border border-sand-200 rounded-t-2xl">
      <Button asChild variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8">
        <Link href="/konsultasi">
          <ArrowLeft className="w-4 h-4 text-sand-500" />
        </Link>
      </Button>

      <Avatar className="w-9 h-9 flex-shrink-0">
        <AvatarImage src={otherImage ?? undefined} />
        <AvatarFallback className="bg-forest-100 text-forest-500 font-semibold text-sm">
          {getInitials(otherName ?? "P")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-forest-500 text-sm truncate">
          {otherName}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
          <span className="text-xs text-sand-500">{statusInfo.label}</span>
          <span className="text-xs text-sand-300">·</span>
          <span className="text-xs text-sand-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {dateLabel}, {timeRange}
          </span>
        </div>
      </div>

      {consultation.videoCallUrl && (
        <Button
          asChild
          size="sm"
          className="bg-teal-dark hover:bg-teal-dark/80 text-white text-xs h-8 flex-shrink-0"
        >
          <a href={consultation.videoCallUrl} target="_blank" rel="noopener noreferrer">
            <Video className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Video Call</span>
            <span className="sm:hidden">Video</span>
          </a>
        </Button>
      )}
    </div>
  );
}
