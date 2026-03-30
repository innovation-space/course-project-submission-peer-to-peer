import { useEffect, useRef } from "react";

export default function BlockchainBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const blocks = [];
    const blockCount = 40;
    const mouse = { x: null, y: null, radius: 180 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    resize();

    // 3D Projection Settings
    const focalLength = 400;

    class Block {
      constructor() {
        this.reset();
      }

      reset() {
        this.baseX = Math.random() * canvas.width;
        this.baseY = Math.random() * canvas.height;
        this.baseZ = (Math.random() - 0.5) * 400;
        
        this.x = this.baseX;
        this.y = this.baseY;
        this.z = this.baseZ;

        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        this.size = Math.random() * 15 + 10;
        this.angleX = Math.random() * Math.PI;
        this.angleY = Math.random() * Math.PI;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
        this.density = Math.random() * 20 + 5;
      }

      project(x, y, z) {
        const perspective = focalLength / (focalLength + z);
        return {
          px: (x - canvas.width / 2) * perspective + canvas.width / 2,
          py: (y - canvas.height / 2) * perspective + canvas.height / 2,
          scale: perspective
        };
      }

      update() {
        // BREAK: Mouse Repulsion
        if (mouse.x !== null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < mouse.radius) {
            let force = (mouse.radius - dist) / mouse.radius;
            let dirX = (dx / dist) * force * this.density;
            let dirY = (dy / dist) * force * this.density;
            this.x -= dirX;
            this.y -= dirY;
            this.z += force * 20; // Push "back" into Z space
          }
        }

        // REJOIN: Spring back to base position
        this.x += (this.baseX - this.x) * 0.05;
        this.y += (this.baseY - this.y) * 0.05;
        this.z += (this.baseZ - this.z) * 0.05;

        this.angleX += this.rotSpeed;
        this.angleY += this.rotSpeed;
      }

      draw() {
        const { px, py, scale } = this.project(this.x, this.y, this.z);
        if (scale < 0) return;

        const s = this.size * scale;
        ctx.strokeStyle = `rgba(0, 191, 255, ${Math.min(scale, 0.6)})`;
        ctx.lineWidth = 1 * scale;

        // Draw simple wireframe cube
        // In a real refined version we'd do 8 vertices, but for background speed 
        // we'll draw a "digital block" look: two offset squares
        ctx.strokeRect(px - s / 2, py - s / 2, s, s);
        ctx.strokeRect(px - s / 3, py - s / 3, s, s);
        
        ctx.beginPath();
        ctx.moveTo(px - s / 2, py - s / 2); ctx.lineTo(px - s / 3, py - s / 3);
        ctx.moveTo(px + s / 2, py - s / 2); ctx.lineTo(px + 2*s/3 - s/3, py - s/3); // Approx corners
        ctx.stroke();
      }
    }

    for (let i = 0; i < blockCount; i++) blocks.push(new Block());

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      blocks.forEach((b, i) => {
        b.update();
        b.draw();

        // Connect nearby blocks
        for (let j = i + 1; j < blocks.length; j++) {
          const b2 = blocks[j];
          const dist = Math.sqrt(Math.pow(b.x - b2.x, 2) + Math.pow(b.y - b2.y, 2));
          if (dist < 200) {
            const p1 = b.project(b.x, b.y, b.z);
            const p2 = b2.project(b2.x, b2.y, b2.z);
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = `rgba(0, 136, 255, ${(1 - dist / 200) * 0.2})`;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "all",
        background: "radial-gradient(circle at center, #0a192f 0%, #02020a 100%)"
      }}
    />
  );
}
