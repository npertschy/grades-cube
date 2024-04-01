<script setup lang="ts">
import Calender from "primevue/calendar";
import Listbox from "primevue/listbox";
import Button from "primevue/button";
import Card from "primevue/card";
import Divider from "primevue/divider";
import { ref, watch } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";

const firstStartDate = ref<Date>();
const firstEndDate = ref<Date>();
const secondStartDate = ref<Date>();
const secondEndDate = ref<Date>();

const { schoolYears, addSchoolYear, format, removeSchoolYear } =
  useSchoolYears();

const selectedSchoolYear = ref<SchoolYear | undefined>();

function handleSave() {
  const id = selectedSchoolYear.value ? selectedSchoolYear.value.id : undefined;
  const schoolYear = {
    id: id,
    firstSemesterStart: firstStartDate.value,
    firstSemesterEnd: firstEndDate.value,
    secondSemesterStart: secondStartDate.value,
    secondSemesterEnd: secondEndDate.value,
  };

  addSchoolYear(schoolYear, () => {
    resetDates();
    selectedSchoolYear.value = undefined;
  });
}

watch(selectedSchoolYear, (current) => loadSchoolYear(current));

function resetDates() {
  firstStartDate.value = undefined;
  firstEndDate.value = undefined;
  secondStartDate.value = undefined;
  secondEndDate.value = undefined;
}

function loadSchoolYear(item: SchoolYear | undefined) {
  resetDates();
  if (item?.id && item.id > 0) {
    firstStartDate.value = item?.firstSemesterStart;
    firstEndDate.value = item?.secondSemesterStart;
    secondStartDate.value = item?.secondSemesterStart;
    secondEndDate.value = item?.secondSemesterEnd;
  }
}

function handleRemove() {
  if (selectedSchoolYear.value) {
    removeSchoolYear(selectedSchoolYear.value);
  }
}
</script>

<template>
  <Card>
    <template #title>Schuljahre verwalten</template>
    <template #content>
      <div class="grid">
        <div class="col-2">
          <Listbox
            v-model="selectedSchoolYear"
            :options="schoolYears"
            class="min-h-full shadow-2"
          >
            <template #option="slotProps">
              <p class="text-center">
                {{ format(slotProps.option) }}
              </p>
            </template>
          </Listbox>
        </div>
        <div class="col-offset-1">
          <p>
            Verwalten Sie hier ihre Schuljahre. Sie können Schuljahre anlegen
            oder bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
            auswählen.
          </p>
          <Divider />
          <div v-show="selectedSchoolYear">
            <Card class="shadow-2">
              <template #title>Erstes Halbjahr</template>
              <template #content>
                <div class="formgrid grid">
                  <div class="field col">
                    <label for="startFirstSemesterField" class="font-semibold"
                      >Start erstes Halbjahr</label
                    >
                    <Calender
                      input-id="startFirstSemesterField"
                      v-model="firstStartDate"
                      class="w-full"
                      date-format="dd.mm.yy"
                      show-icon
                      show-button-bar
                    />
                  </div>
                  <div class="field col">
                    <label for="endFirstSemesterField" class="font-semibold"
                      >Ende erstes Halbjahr</label
                    >
                    <Calender
                      input-id="endFirstSemesterField"
                      v-model="firstEndDate"
                      class="w-full"
                      date-format="dd.mm.yy"
                      show-icon
                      show-button-bar
                    />
                  </div>
                </div>
              </template>
            </Card>
            <Card class="shadow-2 mt-2">
              <template #title>Zweites Halbjahr</template>
              <template #content>
                <div class="formgrid grid">
                  <div class="field col">
                    <label for="startSecondSemesterField" class="font-semibold"
                      >Start zweites Halbjahr</label
                    >
                    <Calender
                      input-id="startSecondSemesterField"
                      v-model="secondStartDate"
                      class="w-full"
                      date-format="dd.mm.yy"
                      show-icon
                      show-button-bar
                    />
                  </div>
                  <div class="field col">
                    <label for="endSecondSemesterField" class="font-semibold"
                      >Ende zweites Halbjahr</label
                    >
                    <Calender
                      input-id="endSecondSemesterField"
                      v-model="secondEndDate"
                      class="w-full"
                      date-format="dd.mm.yy"
                      show-icon
                      show-button-bar
                    />
                  </div>
                </div>
              </template>
            </Card>
            <div class="mt-2">
              <Button label="Speichern" class="col-1" @click="handleSave" />
              <Button
                v-show="
                  selectedSchoolYear &&
                  selectedSchoolYear.id &&
                  selectedSchoolYear.id > 0
                "
                label="Löschen"
                class="col-offset-10 col-1"
                @click="handleRemove"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
@/components/schoolYears/SchoolYear @/components/schoolYears/SchoolYearStore
