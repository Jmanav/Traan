import { Mic, Image, MessageSquare } from 'lucide-react';
import { SignalType } from '@/lib/types';

interface SignalTypeIconProps {
  type: SignalType;
  size?: number;
  className?: string;
}

export default function SignalTypeIcon({ type, size = 14, className = '' }: SignalTypeIconProps) {
  const iconProps = { size, className: `text-muted ${className}` };

  switch (type) {
    case 'audio':
      return <Mic {...iconProps} />;
    case 'image':
      return <Image {...iconProps} />;
    case 'text':
      return <MessageSquare {...iconProps} />;
    default:
      return <MessageSquare {...iconProps} />;
  }
}
