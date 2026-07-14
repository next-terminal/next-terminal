import {useEffect, useRef, useState} from 'react';
import {GripHorizontal} from "lucide-react";
import {useWindowSize} from "react-use";

interface Props {
    onClick?: () => void;
}

const FloatingButton = ({onClick}: Props) => {

    let {height} = useWindowSize();
    const defaultBottom = height - 120;
    const minBottom = 40;
    const maxBottom = defaultBottom;

    const [isMove, setIsMove] = useState(false);
    const [btnPos, setBtnPos] = useState({
        x: 0,
        y: defaultBottom,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: defaultBottom,
    });

    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const button = buttonRef.current;
            if (!button) {
                return;
            }
            if (isMove) {
                let offsetX = e.pageX - btnPos.startX;
                let offsetY = e.pageY - btnPos.startY;
                let x = btnPos.x - offsetX;
                let y = btnPos.y - offsetY;

                // 检查边界
                if (x + button.offsetWidth > document.documentElement.offsetWidth) {
                    x = document.documentElement.offsetWidth - button.offsetWidth;
                }
                if (y + button.offsetHeight > maxBottom) {
                    y = maxBottom - button.offsetHeight;
                }
                if (x < 0) {
                    x = 0;
                }
                if (y < minBottom) {
                    y = minBottom;
                }

                button.style.right = `${x}px`;
                button.style.bottom = `${y}px`;

                setBtnPos((prevPos) => ({
                    ...prevPos,
                    endX: x,
                    endY: y,
                }));
            }
        };

        const handleMouseUp = () => {
            const button = buttonRef.current;
            if (!button) {
                return;
            }
            if (isMove) {
                const dWidth = document.documentElement.clientWidth || document.body.clientWidth;
                const mWidth = button.getBoundingClientRect().width;

                setBtnPos((prevPos) => ({
                    ...prevPos,
                    x: prevPos.endX,
                    y: prevPos.endY,
                    startX: 0,
                    startY: 0,
                }));

                // 增加左右吸附效果
                if (btnPos.x < dWidth / 2) {
                    setBtnPos((prevPos) => ({...prevPos, x: 0}));
                } else {
                    setBtnPos((prevPos) => ({...prevPos, x: dWidth - mWidth}));
                }

                button.style.right = `${btnPos.x}px`;
                setIsMove(false);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isMove, btnPos]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        console.log(`handleMouseDown`, e.pageY, e.pageY)
        setBtnPos((prevPos) => ({
            ...prevPos,
            startX: e.pageX,
            startY: e.pageY,
        }));
        setIsMove(true);
    };

    return (
        <div className="relative w-full h-screen">
            <div
                ref={buttonRef}
                className="fixed rounded-l-md text-white p-1 w-6 h-6 cursor-pointer bg-[#141414] z-50"
                style={{right: `${btnPos.x}px`, bottom: `${btnPos.y}px`}}
                onMouseDown={handleMouseDown}
                onClick={onClick}
            >
                <GripHorizontal className={'h-4 w-4'}/>
            </div>
        </div>
    );
};

export default FloatingButton;
