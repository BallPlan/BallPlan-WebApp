import { forwardRef } from 'react';
import ImageWithFallback from './ImageWithFallback';
import { isVideoUrl } from '../utils/uploadMedia';

// Renders a venue/menu media URL as a <video> when it's a video file and as
// an image (with the usual fallback) otherwise. Extra props go to whichever
// element is rendered.
const MediaView = forwardRef(function MediaView({ src, seed, alt = '', className = '', ...rest }, ref) {
  if (isVideoUrl(src)) {
    return <video ref={ref} src={src} className={className} playsInline muted preload="metadata" {...rest} />;
  }
  const { autoPlay, controls, loop, onEnded, ...imgProps } = rest; // video-only props
  return <ImageWithFallback src={src} seed={seed} alt={alt} className={className} {...imgProps} />;
});

export default MediaView;
