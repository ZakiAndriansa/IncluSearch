import Link from "next/link";
import { ArrowLeft, Video, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials, formatDateTime } from "@/lib/utils";

interface ConsultationHeaderProps {
  consultation: {
    status: string;
    scheduledAt: Date;
    durationMins: number;
    videoCallUrl: string | null;
    parent: { id: string; name: string | null; image: string | null };
    expert: {
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

export function ConsultationHeader({
  consultation,
  currentUserId,
}: ConsultationHeaderProps) {
  const isParent = consultation.parent.id === currentUserId;
  const otherPerson = isParent ? consultation.expert.user : consultation.parent;
  const statusInfo = STATUS_MAP[consultation.status] ?? {
    label: consultation.status,
    dot: "bg-sand-400",
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white border border-sand-200 rounded-t-2xl">
      <Button asChild variant="ghost" size="icon" className="flex-shrink-0">
        <Link href="/konsultasi">
          <ArrowLeft className="w-5 h-5 text-sand-500" />
        </Link>
      </Button>

      <Avatar className="w-10 h-10">
        <AvatarImage src={otherPerson.image ?? undefined} />
        <AvatarFallback className="bg-forest-100 text-forest-500 font-semibold text-sm">
          {getInitials(otherPerson.name ?? "P")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-forest-500 text-sm">
          {otherPerson.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
          <span className="text-xs text-sand-500">{statusInfo.label}</span>
          <span className="text-xs text-sand-400">·</span>
          <Calendar className="w-3 h-3 text-sand-400" />
          <span className="text-xs text-sand-400">
            {formatDateTime(consultation.scheduledAt)}
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
            Video Call
          </a>
        </Button>
      )}
    </div>
  );
}
