<script setup lang="ts">
</script>

<template>
  <div class="max-w-xl">
    <h2 class="font-mono text-2xl text-ink mb-6">
      About proofed<span class="text-accent">.</span>
    </h2>

    <p class="text-body leading-relaxed mb-4">
      A personal cooking notebook that treats recipes the way a developer treats code &mdash; versioned, structured, and always improving.
    </p>

    <p class="text-body leading-relaxed mb-4">
      Recipes on the internet are a mess. A photo of a cookbook page. A Reddit comment. A YouTube video with no written steps. A paywalled site you can't revisit. And when you do find one, the units don't match, cups and ounces are mixed with grams, and the instructions are a wall of text with no structure.
    </p>

    <p class="text-body leading-relaxed mb-6">
      <span class="font-mono">proofed<span class="text-accent">.</span></span> fixes this for the recipes I actually cook. Each one is stored as structured JSON: precise gram weights, explicit steps with exit conditions, and a cook log that tracks what really happened each time I made it. One format, always accessible, always evolving.
    </p>

    <h3 class="font-mono text-sm text-ink mb-3">What it facilitates</h3>

    <ul class="text-body text-sm leading-relaxed space-y-3 mb-8">
      <li class="flex gap-2">
        <span class="text-accent font-mono shrink-0">//</span>
        <span><span class="font-semibold">Repeatable bakes.</span> Grams-only measurements, step-by-step state tracking, and exit conditions for every action. No more guessing what "until golden" means for your oven.</span>
      </li>
      <li class="flex gap-2">
        <span class="text-accent font-mono shrink-0">//</span>
        <span><span class="font-semibold">Learning over time.</span> Cook logs capture personal notes, mistakes, and wins per bake. Step notes attach observations directly to the action that prompted them.</span>
      </li>
      <li class="flex gap-2">
        <span class="text-accent font-mono shrink-0">//</span>
        <span><span class="font-semibold">Recipe versioning.</span> Change logs track how a recipe evolves &mdash; what you tweaked, why, and whether it worked. Roll through your history like git commits.</span>
      </li>
      <li class="flex gap-2">
        <span class="text-accent font-mono shrink-0">//</span>
        <span><span class="font-semibold">Mise en place as a checklist.</span> Ingredients, vessels, and equipment organized per stage. Check them off as you go, auto-advance when a stage is complete.</span>
      </li>
      <li class="flex gap-2">
        <span class="text-accent font-mono shrink-0">//</span>
        <span><span class="font-semibold">Nutritional transparency.</span> Estimated nutrition from USDA data, calculated per ingredient. See exactly where the calories come from.</span>
      </li>
    </ul>

    <div class="border-t-2 border-stone-200 pt-6 text-sm text-stone-500">
      <span>Built by Chris Palmer</span>
    </div>
  </div>
</template>
