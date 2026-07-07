**UX/UI FOR DEALFLOW AI DASHBOARD (GREAT BASE TO BUILD OFF OF FOR OTHER BUILDS AS WELL)**

 \<\!DOCTYPE html\>  
\<html lang="en"\>  
\<head\>  
  \<meta charset="utf-8" /\>  
  \<meta name="viewport" content="width=device-width,initial-scale=1" /\>  
  \<title\>CyGlass Dashboard\</title\>  
  \<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /\>  
  \<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400\&family=Manrope:wght@400;500\&display=swap" rel="stylesheet" /\>  
  \<style\>  
    @keyframes enter3d {  
      0% { transform: perspective(1200px) translateY(18px) translateZ(0) rotateX(6deg) scale(0.992); filter: blur(6px); opacity: 0.15; }  
      100% { transform: perspective(1200px) translateY(0) translateZ(0) rotateX(0) scale(1); filter: blur(0); opacity: 1; }  
    }  
    @keyframes floatParallaxUp {  
      0% { transform: translateY(0) translateZ(0); }  
      100% { transform: translateY(-40px) translateZ(0); }  
    }  
    @keyframes floatParallaxDown {  
      0% { transform: translateY(0) translateZ(0); }  
      100% { transform: translateY(30px) translateZ(0); }  
    }  
    @keyframes marqueeX {  
      0% { transform: translateX(0); }  
      100% { transform: translateX(-50%); }  
    }  
    @keyframes pulseLine {  
      0% { opacity: 0.35; transform: translateX(0); }  
      50% { opacity: 0.9; }  
      100% { opacity: 0.35; transform: translateX(-50%); }  
    }  
    @keyframes flicker {  
      0%, 100% { opacity: 0.35; }  
      50% { opacity: 1; }  
    }  
  \</style\>  
  \<script src="https://cdn.tailwindcss.com"\>\</script\>  
\</head\>  
\<body class="min-h-screen bg-stone-900 text-stone-200 antialiased selection:bg-cyan-500/30 selection:text-cyan-100 flex items-center justify-center p-4 sm:p-6"\>  
  \<\!-- Parallax background layers \--\>  
  \<div class="fixed inset-0 \-z-10 overflow-hidden"\>  
    \<div class="absolute inset-0 bg-stone-950/60"\>\</div\>  
    \<div class="absolute \-top-24 inset-x-0 h-\[70vh\] bg-\[radial-gradient(ellipse\_at\_top,\_rgba(6,182,212,0.18),\_transparent\_60%)\] bg-fixed"  
         style="animation: floatParallaxUp 24s ease-in-out 0s 1 normal both;"\>\</div\>  
    \<div class="absolute \-bottom-24 inset-x-0 h-\[70vh\] bg-\[radial-gradient(ellipse\_at\_bottom,\_rgba(6,182,212,0.12),\_transparent\_65%)\] bg-fixed"  
         style="animation: floatParallaxDown 28s ease-in-out 0s 1 normal both;"\>\</div\>  
    \<div class="absolute inset-0 opacity-\[0.08\] \[mask-image:radial-gradient(ellipse\_at\_center,black,transparent\_75%)\]"  
         style="background-image: linear-gradient(rgba(255,255,255,0.08)\_1px,transparent\_1px), linear-gradient(90deg,rgba(255,255,255,0.08)\_1px,transparent\_1px); background-size: 24px 24px,24px\_24px; background-position: center;"\>\</div\>  
  \</div\>

  \<\!-- Browser frame \--\>  
  \<div class="w-full max-w-\[1400px\] rounded-2xl border border-cyan-800/40 bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-\[rgba(0,\_0,\_0,\_0.17)\_0px\_-23px\_25px\_0px\_inset,\_rgba(0,\_0,\_0,\_0.15)\_0px\_-36px\_30px\_0px\_inset,\_rgba(0,\_0,\_0,\_0.1)\_0px\_-79px\_40px\_0px\_inset,\_rgba(0,\_0,\_0,\_0.06)\_0px\_2px\_1px,\_rgba(0,\_0,\_0,\_0.09)\_0px\_4px\_2px,\_rgba(0,\_0,\_0,\_0.09)\_0px\_8px\_4px,\_rgba(0,\_0,\_0,\_0.09)\_0px\_16px\_8px,\_rgba(0,\_0,\_0,\_0.09)\_0px\_32px\_16px)\]"  
       style="animation: enter3d 900ms ease-in-out 0s 1 normal both;"\>  
    \<\!-- Browser top bar \--\>  
    \<div class="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-cyan-800/40 bg-stone-900/50 rounded-t-2xl"\>  
      \<div class="flex items-center gap-2"\>  
        \<span class="h-3 w-3 rounded-full bg-red-500/80 border border-red-300/40"\>\</span\>  
        \<span class="h-3 w-3 rounded-full bg-amber-400/80 border border-amber-200/40"\>\</span\>  
        \<span class="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-300/40"\>\</span\>  
      \</div\>  
      \<div class="mx-3 h-6 w-px bg-white/10"\>\</div\>  
      \<div class="flex-1 flex items-center gap-2"\>  
        \<\!-- Back \--\>  
        \<button class="h-8 w-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50" title="Back"\>  
          \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-stone-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="m15 18-6-6 6-6"/\>\</svg\>  
        \</button\>  
        \<\!-- Address bar \--\>  
        \<div class="flex-1 h-9 rounded-lg bg-stone-800/60 border border-cyan-800/60 text-stone-300 px-3 flex items-center gap-2 backdrop-blur-sm"\>  
          \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<circle cx="11" cy="11" r="7"/\>\<path d="m21 21-4.3-4.3"/\>\</svg\>  
          \<span class="truncate text-sm"\>https://dash.cyglass.app/home\</span\>  
        \</div\>  
        \<\!-- Refresh \--\>  
        \<button class="h-8 w-8 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50" title="Refresh"\>  
          \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-stone-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M21 12a9 9 0 1 1-9-9"/\>\<path d="M21 3v6h-6"/\>\</svg\>  
        \</button\>  
      \</div\>  
      \<div class="ml-3 flex items-center gap-2"\>  
        \<div class="h-8 w-8 rounded-full overflow-hidden border border-white/10"\>  
          \<img src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80\&w=96\&auto=format\&fit=crop" alt="avatar" class="h-full w-full object-cover" /\>  
        \</div\>  
      \</div\>  
    \</div\>

    \<\!-- App shell \--\>  
    \<div class="flex"\>  
      \<\!-- Sidebar Left \--\>  
      \<aside class="w-\[76px\] sm:w-\[84px\] shrink-0 border-r border-cyan-800/40 bg-stone-900/40 backdrop-blur-xl"\>  
        \<div class="px-3 sm:px-4 py-4 flex flex-col items-center gap-4"\>  
          \<\!-- Logo \--\>  
          \<div class="w-full flex items-center justify-center pt-1 pb-4"\>  
            \<div class="px-2 py-2 rounded-lg border border-cyan-800/60 bg-stone-900/60 backdrop-blur-sm shadow-inner" title="Your Logo"\>  
              \<span class="text-cyan-400 text-lg font-semibold tracking-tight" style="font-family: 'Barlow Condensed', system-ui, \-apple-system, Segoe UI, Roboto, Manrope; font-weight: 400;"\>CG\</span\>  
            \</div\>  
          \</div\>

          \<\!-- Nav icons \--\>  
          \<nav class="flex flex-col items-center gap-2 w-full"\>  
            \<\!-- Home \--\>  
            \<button class="w-full group" title="Home"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-cyan-800/50 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 80ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-cyan-400 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 12l9-9 9 9"/\>\<path d="M9 21V9h6v12"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
            \<\!-- Deal Room \--\>  
            \<button class="w-full group" title="Deal Room"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 120ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<rect x="3" y="7" width="18" height="13" rx="2"/\>\<path d="M16 7V5a4 4 0 0 0-8 0v2"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
            \<\!-- Appointments \--\>  
            \<button class="w-full group" title="Appointments"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 160ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<rect x="3" y="4" width="18" height="18" rx="2"/\>\<path d="M16 2v4"/\>\<path d="M8 2v4"/\>\<path d="M3 10h18"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
            \<\!-- Leads \--\>  
            \<button class="w-full group" title="Leads"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 200ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M21 15V6a2 2 0 0 0-2-2H7l-4 4v7a2 2 0 0 0 2 2h8"/\>\<path d="M3 10h4a2 2 0 0 0 2-2V4"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
            \<\!-- Clients \--\>  
            \<button class="w-full group" title="Clients"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 240ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/\>\<circle cx="12" cy="7" r="4"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>

            \<div class="my-2 h-px w-10 bg-white/10"\>\</div\>

            \<\!-- Notes \--\>  
            \<button class="w-full group" title="Notes"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 280ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="m3 3 18 18"/\>\<path d="M19 19H7a2 2 0 0 1-2-2V5"/\>\<path d="M9 7h6"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
            \<\!-- To‑Do \--\>  
            \<button class="w-full group" title="To‑Do List"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 320ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="m9 11 3 3L22 4"/\>\<path d="M21 12v7a2 2 0 0 1-2 2H7l-4-4V5a2 2 0 0 1 2-2h11"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
            \<\!-- Settings \--\>  
            \<button class="w-full group" title="Settings"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 360ms 1 normal both;"\>  
                \<div class="p-3"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M12 6v12"/\>\<path d="M20 12H4"/\>\<circle cx="12" cy="12" r="3"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
            \<\!-- AI Concierge \--\>  
            \<button class="w-full group" title="AI Concierge"\>  
              \<div class="w-full flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"  
                   style="animation: enter3d 900ms ease-in-out 400ms 1 normal both;"\>  
                \<div class="p-3 relative"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 stroke-stone-300 group-hover:stroke-cyan-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<rect x="3" y="8" width="18" height="12" rx="2"/\>\<path d="M7 8V6a5 5 0 0 1 10 0v2"/\>\<path d="M8 14h.01"/\>\<path d="M12 14h.01"/\>\<path d="M16 14h.01"/\>\</svg\>  
                \</div\>  
              \</div\>  
            \</button\>  
          \</nav\>  
        \</div\>  
      \</aside\>

      \<\!-- Main content \--\>  
      \<main class="flex-1 min-w-0"\>  
        \<\!-- Header \--\>  
        \<header class="px-5 sm:px-8 pt-6 pb-4 border-b border-white/10 bg-gradient-to-b from-white/\[0.03\] to-transparent"\>  
          \<div class="grid grid-cols-1 gap-4 items-start"\>  
            \<\!-- Greeting \--\>  
            \<div class="lg:col-span-1"\>  
              \<h1 class="text-stone-50 tracking-tight" style="font-family: 'Barlow Condensed', system-ui, \-apple-system, Segoe UI, Roboto, Manrope; font-weight: 400; font-size: clamp(42px, 5vw, 48px); animation: enter3d 900ms ease-in-out 120ms 1 normal both;"\>  
                Command Center  
              \</h1\>  
              \<p class="text-stone-300/90 text-base sm:text-lg" style="font-family: Manrope; font-weight: 400; animation: enter3d 900ms ease-in-out 160ms 1 normal both;"\>  
                Hi Steve  
              \</p\>  
              \<div class="mt-3 flex items-center gap-2 sm:gap-3" style="animation: enter3d 900ms ease-in-out 180ms 1 normal both;"\>  
                \<button class="h-10 px-3 sm:px-4 rounded-lg border border-cyan-800/60 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 text-stone-100 flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-\[18px\] w-\[18px\] stroke-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M12 5v14"/\>\<path d="M5 12h14"/\>\</svg\>  
                  \<span class="text-sm sm:text-base"\>New Deal\</span\>  
                \</button\>  
                \<button class="h-10 px-3 sm:px-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-stone-100 flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-\[18px\] w-\[18px\] stroke-stone-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 6h18"/\>\<path d="M7 12h10"/\>\<path d="M10 18h4"/\>\</svg\>  
                  \<span class="text-sm sm:text-base"\>Filters\</span\>  
                \</button\>  
              \</div\>  
            \</div\>  
          \</div\>

          \<\!-- Marquee \--\>  
          \<div class="mt-4 overflow-hidden rounded-lg border border-cyan-800/40 bg-stone-900/40 backdrop-blur"\>  
            \<div class="flex items-center gap-2 px-3 py-2 border-b border-white/10"\>  
              \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 12h18"/\>\<path d="M12 3v18"/\>\</svg\>  
              \<span class="text-xs sm:text-sm text-stone-300"\>Pipeline Signals\</span\>  
            \</div\>  
            \<div class="relative"\>  
              \<div class="flex whitespace-nowrap" style="animation: marqueeX 30s linear 0s infinite normal both;"\>  
                \<div class="flex items-center gap-3 px-3 py-2"\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>New scored leads \+42\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Hot leads 12\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Appts today 3\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Avg score 83\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>YTD $842k\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Win rate 31%\</span\>  
                \</div\>  
                \<div class="flex items-center gap-3 px-3 py-2"\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>New scored leads \+42\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Hot leads 12\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Appts today 3\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Avg score 83\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>YTD $842k\</span\>  
                  \<span class="px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-800/50 text-xs sm:text-sm"\>Win rate 31%\</span\>  
                \</div\>  
              \</div\>  
            \</div\>  
          \</div\>  
        \</header\>

        \<\!-- Content grid \--\>  
        \<section class="px-5 sm:px-8 py-6 sm:py-8 space-y-6"\>  
          \<\!-- KPI row \--\>  
          \<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"\>  
            \<div class="rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 220ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<span class="text-stone-400 text-sm" style="font-family: Manrope;"\>YTD Commissions\</span\>  
                \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 3v18h18"/\>\<path d="M7 13l3 3 7-7"/\>\</svg\>  
              \</div\>  
              \<div class="mt-2 flex items-end justify-between"\>  
                \<div\>  
                  \<div class="text-3xl sm:text-4xl text-stone-50 tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>$842k\</div\>  
                  \<div class="text-cyan-300 text-sm"\>+12.4%\</div\>  
                \</div\>  
                \<div class="h-10 w-24 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-sm border border-cyan-800/40"\>\</div\>  
              \</div\>  
            \</div\>  
            \<div class="rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 240ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<span class="text-stone-400 text-sm" style="font-family: Manrope;"\>New Leads\</span\>  
                \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="m3 17 6-6 4 4 7-7"/\>\</svg\>  
              \</div\>  
              \<div class="mt-2 flex items-end justify-between"\>  
                \<div\>  
                  \<div class="text-3xl sm:text-4xl text-stone-50 tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>+312\</div\>  
                  \<div class="text-cyan-300 text-sm"\>7d\</div\>  
                \</div\>  
                \<div class="h-10 w-24 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-sm border border-cyan-800/40"\>\</div\>  
              \</div\>  
            \</div\>  
            \<div class="rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 260ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<span class="text-stone-400 text-sm" style="font-family: Manrope;"\>Appointments\</span\>  
                \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<rect x="3" y="4" width="18" height="18" rx="2"/\>\<path d="M16 2v4"/\>\<path d="M8 2v4"/\>\<path d="M3 10h18"/\>\</svg\>  
              \</div\>  
              \<div class="mt-2 flex items-end justify-between"\>  
                \<div\>  
                  \<div class="text-3xl sm:text-4xl text-stone-50 tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>9\</div\>  
                  \<div class="text-cyan-300 text-sm"\>this week\</div\>  
                \</div\>  
                \<div class="h-10 w-24 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-sm border border-cyan-800/40"\>\</div\>  
              \</div\>  
            \</div\>  
            \<div class="rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 280ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<span class="text-stone-400 text-sm" style="font-family: Manrope;"\>Win Rate\</span\>  
                \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<circle cx="12" cy="12" r="9"/\>\<path d="M12 8v4"/\>\<path d="M12 16h.01"/\>\</svg\>  
              \</div\>  
              \<div class="mt-2 flex items-end justify-between"\>  
                \<div\>  
                  \<div class="text-3xl sm:text-4xl text-stone-50 tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>31%\</div\>  
                  \<div class="text-cyan-300 text-sm"\>+2.1%\</div\>  
                \</div\>  
                \<div class="h-10 w-24 bg-gradient-to-t from-cyan-500/20 to-transparent rounded-sm border border-cyan-800/40"\>\</div\>  
              \</div\>  
            \</div\>  
          \</div\>

          \<\!-- Charts and snapshot \--\>  
          \<div class="grid grid-cols-1 lg:grid-cols-3 gap-4"\>  
            \<\!-- Main area chart (repurposed) \--\>  
            \<div class="lg:col-span-2 rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 sm:p-5 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 320ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<div class="flex items-center gap-2"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 3v18h18"/\>\<path d="M7 13l3 3 7-7"/\>\</svg\>  
                  \<h3 class="text-stone-100 text-2xl sm:text-\[28px\] tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>Lead Volume & Conversion\</h3\>  
                \</div\>  
                \<div class="flex items-center gap-2"\>  
                  \<button class="h-8 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 text-stone-100 text-sm transition-colors"\>24h\</button\>  
                  \<button class="h-8 px-3 rounded-md border border-cyan-800/60 bg-cyan-500/10 text-cyan-200 text-sm"\>7d\</button\>  
                  \<button class="h-8 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 text-stone-100 text-sm"\>30d\</button\>  
                \</div\>  
              \</div\>  
              \<div class="mt-4"\>  
                \<div class="h-56 sm:h-72 w-full rounded-lg border border-cyan-800/40 bg-gradient-to-b from-cyan-500/10 to-transparent relative overflow-hidden"\>  
                  \<div class="absolute inset-0 opacity-20"  
                       style="background-image: linear-gradient(rgba(255,255,255,0.06)\_1px,transparent\_1px), linear-gradient(90deg,rgba(255,255,255,0.06)\_1px,transparent\_1px); background-size: 28px\_28px,28px\_28px;"\>\</div\>  
                  \<canvas id="trafficLatencyChart" class="absolute inset-0"\>\</canvas\>  
                \</div\>  
              \</div\>  
            \</div\>

            \<\!-- Today's Snapshot \--\>  
            \<div class="rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 sm:p-5 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 340ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<div class="flex items-center gap-2"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M4 7h16"/\>\<path d="M10 11h10"/\>\<path d="M4 15h16"/\>\<path d="M10 19h10"/\>\</svg\>  
                  \<h3 class="text-stone-100 text-2xl sm:text-\[28px\] tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>Today's Snapshot\</h3\>  
                \</div\>  
                \<button class="h-8 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 text-stone-100 text-sm transition-colors"\>View all\</button\>  
              \</div\>  
              \<ul class="mt-4 space-y-3"\>  
                \<li class="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-900/50 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"\>  
                  \<div class="flex items-center gap-3"\>  
                    \<div class="h-9 w-9 rounded-md bg-cyan-500/15 border border-cyan-800/60 flex items-center justify-center"\>  
                      \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<rect x="3" y="4" width="18" height="18" rx="2"/\>\<path d="M16 2v4"/\>\<path d="M8 2v4"/\>\<path d="M3 10h18"/\>\</svg\>  
                    \</div\>  
                    \<div\>  
                      \<p class="text-sm sm:text-base text-stone-100" style="font-family: Manrope;"\>3 appointments today\</p\>  
                      \<p class="text-xs text-stone-400" style="font-family: Manrope;"\>First at 9:30 AM · Zoom\</p\>  
                    \</div\>  
                  \</div\>  
                  \<span class="text-xs text-cyan-300"\>calendar\</span\>  
                \</li\>  
                \<li class="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-900/50 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"\>  
                  \<div class="flex items-center gap-3"\>  
                    \<div class="h-9 w-9 rounded-md bg-cyan-500/15 border border-cyan-800/60 flex items-center justify-center"\>  
                      \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="m3 17 6-6 4 4 7-7"/\>\</svg\>  
                    \</div\>  
                    \<div\>  
                      \<p class="text-sm sm:text-base text-stone-100" style="font-family: Manrope;"\>12 hot leads require follow-up\</p\>  
                      \<p class="text-xs text-stone-400" style="font-family: Manrope;"\>AI ranked · Score ≥ 80\</p\>  
                    \</div\>  
                  \</div\>  
                  \<span class="text-xs text-cyan-300"\>leads\</span\>  
                \</li\>  
                \<li class="flex items-center justify-between gap-3 p-3 rounded-lg bg-stone-900/50 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"\>  
                  \<div class="flex items-center gap-3"\>  
                    \<div class="h-9 w-9 rounded-md bg-cyan-500/15 border border-cyan-800/60 flex items-center justify-center"\>  
                      \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 3h18"/\>\<path d="M9 7h12"/\>\<path d="M9 11h12"/\>\<path d="M9 15h12"/\>\<path d="M3 7h.01M3 11h.01M3 15h.01"/\>\</svg\>  
                    \</div\>  
                    \<div\>  
                      \<p class="text-sm sm:text-base text-stone-100" style="font-family: Manrope;"\>5 tasks due\</p\>  
                      \<p class="text-xs text-stone-400" style="font-family: Manrope;"\>2 past due · 3 due today\</p\>  
                    \</div\>  
                  \</div\>  
                  \<span class="text-xs text-cyan-300"\>to‑do\</span\>  
                \</li\>  
              \</ul\>  
            \</div\>  
          \</div\>

          \<\!-- Notes & Upcoming Week \--\>  
          \<div class="grid grid-cols-1 lg:grid-cols-3 gap-4"\>  
            \<\!-- Quick Notes widget \--\>  
            \<div class="rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 sm:p-5 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 360ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<div class="flex items-center gap-2"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 3h13a4 4 0 0 1 4 4v13"/\>\<path d="M3 17h13a4 4 0 0 0 4-4V3"/\>\</svg\>  
                  \<h3 class="text-stone-100 text-2xl sm:text-\[28px\] tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>Quick Notes\</h3\>  
                \</div\>  
                \<button id="save-note" class="h-8 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 text-stone-100 text-sm transition-colors"\>Save\</button\>  
              \</div\>  
              \<div class="mt-4"\>  
                \<textarea id="note-area" class="w-full h-40 rounded-lg bg-stone-900/60 border border-white/10 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 outline-none p-3 text-sm text-stone-200" placeholder="Jot down thoughts, meeting prep, or follow-up bullets..." style="font-family: Manrope;"\>\</textarea\>  
              \</div\>  
            \</div\>

            \<\!-- Upcoming Week \--\>  
            \<div class="lg:col-span-2 rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 sm:p-5 hover:bg-white/\[0.07\] transition-colors"  
                 style="animation: enter3d 900ms ease-in-out 380ms 1 normal both;"\>  
              \<div class="flex items-center justify-between"\>  
                \<div class="flex items-center gap-2"\>  
                  \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<rect x="3" y="4" width="18" height="18" rx="2"/\>\<path d="M16 2v4"/\>\<path d="M8 2v4"/\>\<path d="M3 10h18"/\>\</svg\>  
                  \<h3 class="text-stone-100 text-2xl sm:text-\[28px\] tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>Upcoming Week\</h3\>  
                \</div\>  
                \<div class="flex items-center gap-2"\>  
                  \<button class="h-8 px-3 rounded-md border border-white/10 bg-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/60 text-stone-100 text-sm transition-colors"\>Open Appointments\</button\>  
                \</div\>  
              \</div\>

              \<div class="mt-4 overflow-hidden rounded-lg border border-white/10"\>  
                \<div class="hidden md:grid grid-cols-5 bg-stone-900/50 text-stone-400 text-sm" style="font-family: Manrope;"\>  
                  \<div class="px-3 py-2 border-r border-white/10"\>Day\</div\>  
                  \<div class="px-3 py-2 border-r border-white/10"\>Time\</div\>  
                  \<div class="px-3 py-2 border-r border-white/10"\>Title\</div\>  
                  \<div class="px-3 py-2 border-r border-white/10"\>With\</div\>  
                  \<div class="px-3 py-2"\>Status\</div\>  
                \</div\>  
                \<div class="divide-y divide-white/10"\>  
                  \<div class="grid grid-cols-1 md:grid-cols-5 bg-white/5 hover:bg-cyan-500/5 transition-colors"\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Mon\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>9:30 AM\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Valuation Review\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Acme Co.\</div\>  
                    \<div class="px-3 py-3 text-sm text-cyan-300" style="font-family: Manrope;"\>confirmed\</div\>  
                  \</div\>  
                  \<div class="grid grid-cols-1 md:grid-cols-5 bg-white/5 hover:bg-cyan-500/5 transition-colors"\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Tue\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>1:00 PM\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Buyer Intro Call\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Blue Ridge\</div\>  
                    \<div class="px-3 py-3 text-sm text-cyan-300" style="font-family: Manrope;"\>pending\</div\>  
                  \</div\>  
                  \<div class="grid grid-cols-1 md:grid-cols-5 bg-white/5 hover:bg-cyan-500/5 transition-colors"\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Thu\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>11:15 AM\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>LOI Review\</div\>  
                    \<div class="px-3 py-3 border-b md:border-b-0 md:border-r border-white/10 text-sm text-stone-300" style="font-family: Manrope;"\>Northstar\</div\>  
                    \<div class="px-3 py-3 text-sm text-cyan-300" style="font-family: Manrope;"\>scheduled\</div\>  
                  \</div\>  
                \</div\>  
              \</div\>  
            \</div\>  
          \</div\>

          \<\!-- Scoring animation (bottom ribbon) \--\>  
          \<div class="rounded-xl border border-cyan-800/50 bg-white/5 backdrop-blur-xl p-4 sm:p-5 hover:bg-white/\[0.07\] transition-colors"  
               style="animation: enter3d 900ms ease-in-out 400ms 1 normal both;"\>  
            \<div class="flex items-center justify-between"\>  
              \<div class="flex items-center gap-2"\>  
                \<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 stroke-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"\>\<path d="M3 12h18"/\>\<path d="M12 3v18"/\>\</svg\>  
                \<h3 class="text-stone-100 text-2xl sm:text-\[28px\] tracking-tight" style="font-family: 'Barlow Condensed'; font-weight: 400;"\>Deal Scoring Engine\</h3\>  
              \</div\>  
              \<span class="text-xs text-stone-400" style="font-family: Manrope;"\>simulated visualization\</span\>  
            \</div\>  
            \<div class="mt-4 relative overflow-hidden rounded-lg border border-cyan-800/40 bg-stone-900/60"\>  
              \<div class="absolute inset-0 opacity-20"  
                   style="background-image: linear-gradient(rgba(255,255,255,0.06)\_1px,transparent\_1px), linear-gradient(90deg,rgba(255,255,255,0.06)\_1px,transparent\_1px); background-size: 24px\_24px;"\>\</div\>  
              \<div class="p-4 space-y-4"\>  
                \<\!-- Lane 1 \--\>  
                \<div class="relative h-8 overflow-hidden rounded-md border border-white/10 bg-stone-800/60"\>  
                  \<div class="absolute inset-y-0 left-0 w-\[200%\] flex items-center gap-2 px-2"  
                       style="animation: pulseLine 14s linear 0s infinite;"\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Ingest\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Normalize\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Enrich\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Score\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Rank\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Route\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Notify\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Ingest\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Normalize\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Enrich\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Score\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Rank\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Route\</span\>  
                    \<span class="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-700/40 text-cyan-300 text-xs" style="font-family: Manrope;"\>Notify\</span\>  
                  \</div\>  
                \</div\>  
                \<\!-- Lane 2 \--\>  
                \<div class="relative h-8 overflow-hidden rounded-md border border-white/10 bg-stone-800/60"\>  
                  \<div class="absolute inset-y-0 left-0 w-\[200%\] flex items-center gap-2 px-2"  
                       style="animation: pulseLine 16s linear \-6s infinite;"\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Financials\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Sector\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Owner Fit\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Timing\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Probability\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Next Best Action\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Score\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Financials\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Sector\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Owner Fit\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Timing\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-700/40 text-emerald-300 text-xs" style="font-family: Manrope;"\>Probability\</span\>  
                    \<span class="px-2 py-1 rounded bg-emerald-