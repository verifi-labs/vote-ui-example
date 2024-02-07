import React, { FC, useMemo } from 'react';
import { getStampUrl } from '../helpers/utils';
import Image from 'next/image';

interface AvatarStampProps {
  type?: 'avatar' | 'space' | 'token';
  id: string;
  size?: number;
  width?: number;
  height?: number;
  cb?: string;
  className?: string;
}

const AvatarStamp: FC<AvatarStampProps> = (props) => {
  const { type = 'avatar', id, size = 22, width, height, cb } = props;

  const imageUrl = useMemo(() => {
    return getStampUrl(type, id, width && height ? { width, height } : size, cb);
  }, [type, id, size, width, height, cb]);

  const style = !width && !height ? { width: `${size}px`, height: `${size}px` } : {};

  return (
    <Image
      src={imageUrl}
      className={`rounded-full inline-block bg-skin-border ${props.className}`}
      style={style}
      alt={`Avatar for ${id}`}
    />
  );
};

export default AvatarStamp;
