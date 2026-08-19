<script setup lang="ts">
import PInputNumber from "primevue/inputnumber";
import PToggleSwitch from "primevue/toggleswitch";
import { computed } from "vue";

const totalPoints = defineModel<number | null>("totalPoints");
const achievedPoints = defineModel<number | null>("achievedPoints");
const grammarPoints = defineModel<number | null>("grammarPoints");
const includeGrammar = defineModel<boolean>("includeGrammar", { default: false });

const maxPointsToAchieve = computed(() => {
  if (totalPoints.value === null || totalPoints.value! <= 0) return 0;
  if (includeGrammar.value) {
    return totalPoints.value! * 0.9;
  }
  return totalPoints.value;
});

const maxGrammarPoints = computed(() => {
  if (totalPoints.value === null || totalPoints.value! <= 0) return 0;
  return totalPoints.value! * 0.1;
});
</script>

<template>
  <div class="calculator-form">
    <div class="form-field">
      <label for="totalPoints">Gesamt:</label>
      <p-input-number
        v-model="totalPoints"
        input-id="totalPoints"
        fluid
        :min="0"
        :max="1000"
      />
    </div>

    <div class="form-field">
      <label for="achievedPoints">Erreicht:</label>
      <p-input-number
        v-model="achievedPoints"
        input-id="achievedPoints"
        fluid
        :min="0"
        :max="maxPointsToAchieve"
        :min-fraction-digits="0"
        :max-fraction-digits="1"
      />
      <p>/ {{ maxPointsToAchieve }}</p>
    </div>

    <div class="toggle-row">
      <label for="includeGrammar">Rechtschreibung berücksichtigen</label>
      <p-toggle-switch
        v-model="includeGrammar"
        input-id="includeGrammar"
      />
    </div>

    <div
      v-if="includeGrammar"
      class="form-field"
    >
      <label for="grammar">Rechtschreibung:</label>
      <p-input-number
        v-model="grammarPoints"
        input-id="grammar"
        fluid
        :min="0"
        :max="maxGrammarPoints"
        :min-fraction-digits="0"
        :max-fraction-digits="1"
      />
      <p>/ {{ maxGrammarPoints }}</p>
    </div>
  </div>
</template>

<style scoped>
.calculator-form {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-field {
  display: grid;
  grid-template-columns: 150px 1fr 1fr;
  align-items: center;
  gap: 1rem;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
