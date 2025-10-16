import React, { useEffect, useMemo } from 'react';
import './RecognitionDetector.css';

const RecognitionDetector = ({ imageUrl, boxes, box, objects, loading, onBoxClick }) => {
    const normalizedBoxes = useMemo(() => {
        const img = typeof document !== 'undefined' ? document.getElementById('inputimage') : null;
        const imgW = img ? Number(img.width) : null;
        const imgH = img ? Number(img.height) : null;

        const toPixelBox = (b) => {
            if (b == null) return null;
            if (typeof b.width === 'number' && typeof b.height === 'number') {
                return { left: b.leftCol, top: b.topRow, width: b.width, height: b.height };
            }
            if (typeof b.rightCol === 'number' && typeof b.bottomRow === 'number' && imgW != null && imgH != null) {
                const left = b.leftCol;
                const top = b.topRow;
                const width = imgW - left - b.rightCol;
                const height = imgH - top - b.bottomRow;
                return { left, top, width, height };
            }
            if (imgW != null && imgH != null) {
                if (b.leftCol <= 1 && b.topRow <= 1) {
                    const left = b.leftCol * imgW;
                    const top = b.topRow * imgH;
                    const width = (b.width && b.width <= 1) ? b.width * imgW : (b.rightCol && b.rightCol <= 1 ? (b.rightCol - b.leftCol) * imgW : (b.width || 0));
                    const height = (b.height && b.height <= 1) ? b.height * imgH : (b.bottomRow && b.bottomRow <= 1 ? (b.bottomRow - b.topRow) * imgH : (b.height || 0));
                    return { left, top, width, height };
                }
            }
            return { left: b.leftCol || 0, top: b.topRow || 0, width: b.width || 0, height: b.height || 0 };
        };

        let raw = [];
        if (Array.isArray(boxes) && boxes.length > 0) raw = boxes;
        else if (box) raw = [box];

        return raw.map(toPixelBox).filter(Boolean);
    }, [boxes, box]);

    const normalizedObjects = useMemo(() => {
        if (!objects || objects.length === 0) return [];
        
        const img = typeof document !== 'undefined' ? document.getElementById('inputimage') : null;
        const imgW = img ? Number(img.width) : null;
        const imgH = img ? Number(img.height) : null;

        if (!imgW || !imgH) return [];

        return objects.map(obj => {
            const left = obj.left_col * imgW;
            const top = obj.top_row * imgH;
            const width = (obj.right_col - obj.left_col) * imgW;
            const height = (obj.bottom_row - obj.top_row) * imgH;
            
            return {
                left: Math.max(0, Math.round(left)),
                top: Math.max(0, Math.round(top)),
                width: Math.max(0, Math.round(width)),
                height: Math.max(0, Math.round(height)),
                name: obj.name,
                confidence: obj.confidence
            };
        });
    }, [objects]);

    useEffect(() => {
        const img = document.getElementById('inputimage');
        console.log('RecognitionDetector ready; image size', img ? { width: img.width, height: img.height } : null);
    }, [loading]);

    if (!imageUrl) return null;

    return (
        <div className='center ma'>
            <div className='center mt2 detector-container' style={{ position: 'relative', display: 'block', margin: '0 auto', width: 'fit-content' }}>
                <img 
                    id='inputimage' 
                    alt='' 
                    src={imageUrl} 
                    crossOrigin="anonymous"
                    style={{ display: 'block', width: '500px', height: 'auto' }} 
                />
                
                {/* SVG Layer for connector lines */}
                <svg 
                    className="overlay-svg"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 5
                    }}
                >
                    {/* Face box connector lines */}
                    {normalizedBoxes.map((b, i) => {
                        const boxCenterX = b.left + b.width / 2;
                        const boxTop = b.top;
                        const labelX = b.left;
                        const labelY = boxTop - 28;
                        
                        return (
                            <g key={`face-line-${i}`}>
                                <line
                                    x1={boxCenterX}
                                    y1={boxTop}
                                    x2={labelX + 40}
                                    y2={labelY + 14}
                                    stroke="#00ffcb"
                                    strokeWidth="1"
                                    opacity="0.6"
                                    className="connector-line"
                                />
                                <circle cx={boxCenterX} cy={boxTop} r="3" fill="#00ffcb" opacity="0.8" />
                            </g>
                        );
                    })}

                    {/* Object box connector lines */}
                    {normalizedObjects.map((obj, i) => {
                        const boxCenterX = obj.left + obj.width / 2;
                        const boxTop = obj.top;
                        const labelX = obj.left;
                        const labelY = boxTop - 28;
                        
                        return (
                            <g key={`object-line-${i}`}>
                                <line
                                    x1={boxCenterX}
                                    y1={boxTop}
                                    x2={labelX + 60}
                                    y2={labelY + 14}
                                    stroke="#b544ff"
                                    strokeWidth="1"
                                    opacity="0.6"
                                    className="connector-line"
                                />
                                <circle cx={boxCenterX} cy={boxTop} r="3" fill="#b544ff" opacity="0.8" />
                            </g>
                        );
                    })}
                </svg>
                
                {loading && (
                    <div className='rd-spinner-overlay'>
                        <div className='rd-spinner'></div>
                    </div>
                )}

                {/* Face boxes (Cyan) */}
                {normalizedBoxes.map((b, i) => {
                    const originalBox = Array.isArray(boxes) && boxes.length > 0 ? boxes[i] : box;
                    
                    return (
                        <div 
                            key={`face-${i}`} 
                            className='bounding-box face-box' 
                            style={{ 
                                top: b.top + 'px', 
                                left: b.left + 'px', 
                                width: b.width + 'px', 
                                height: b.height + 'px',
                                zIndex: 100
                            }}
                            onClick={() => onBoxClick && onBoxClick('face', i, undefined, originalBox)}
                            title="Click to search web for similar faces"
                        >
                            <span className="box-label face-label">
                                <span className="label-icon">👤</span> Face {i + 1}
                            </span>
                            
                            <div className="corner corner-tl"></div>
                            <div className="corner corner-tr"></div>
                            <div className="corner corner-bl"></div>
                            <div className="corner corner-br"></div>
                        </div>
                    );
                })}

                {/* Object boxes (Purple) */}
                {normalizedObjects.map((obj, i) => {
                    const originalObj = objects[i];
                    
                    return (
                        <div 
                            key={`object-${i}`} 
                            className='bounding-box object-box' 
                            style={{ 
                                top: obj.top + 'px', 
                                left: obj.left + 'px', 
                                width: obj.width + 'px', 
                                height: obj.height + 'px',
                                zIndex: 50
                            }}
                            onClick={() => onBoxClick && onBoxClick('object', i, obj.name, originalObj)}
                            title={`Click to search web for ${obj.name}`}
                        >
                            <span className="box-label object-label">
                                <span className="label-icon">🔍</span> {obj.name} {Math.round(obj.confidence * 100)}%
                            </span>
                            
                            <div className="corner corner-tl"></div>
                            <div className="corner corner-tr"></div>
                            <div className="corner corner-bl"></div>
                            <div className="corner corner-br"></div>
                        </div>
                    );
                })}
            </div>

            {/* Detection Summary */}
            {(normalizedBoxes.length > 0 || normalizedObjects.length > 0) && !loading && (
                <div className="detection-summary">
                    <p className="f4 white">
                        {normalizedBoxes.length > 0 && (
                            <span className="face-count">
                                👤 {normalizedBoxes.length} face{normalizedBoxes.length > 1 ? 's' : ''}
                            </span>
                        )}
                        {normalizedBoxes.length > 0 && normalizedObjects.length > 0 && <span> • </span>}
                        {normalizedObjects.length > 0 && (
                            <span className="object-count">
                                🔍 {normalizedObjects.length} object{normalizedObjects.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </p>
                    <p className="f6 white-70 mt2">
                        💡 Click any box to search the web for similar images
                    </p>
                </div>
            )}
        </div>
    );
}

export default RecognitionDetector;
