import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

export default function Tools() {
    const [width, setWidth] = React.useState(64);
    const dragHandler = React.useCallback(
        (e) => {
        if(e.clientX >= 900) return;
        if (e.clientX < 160 && e.clientX > 0) {
            document.getElementById("resize").classList.add("bg-blue-600")
            document.getElementById("sidebar").classList.add("hidden")
            document.getElementById("sidebar").style.width = `${e.clientX-50}px`;
        }
        if (e.clientX > 160) {
            document.getElementById("resize").classList.add("bg-blue-600")
            document.getElementById("sidebar").classList.remove("hidden")
            document.getElementById("sidebar").style.width = `${e.clientX-50}px`;
        }
        if (e.clientX === 0) {
            document.getElementById("resize").classList.remove("bg-blue-600")
        }
        },
        [width]
      );

    return (
      <aside id="resize" className="w-0.5 bg-discord-4 hover:bg-blue-600 overflow-auto cursor-ew-resize" draggable onDragEnd={() => document.getElementById("resize").classList.remove("bg-blue-600")} onDrag={dragHandler}>

      </aside>
  )
};