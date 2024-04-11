<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import Calender from "primevue/calendar";
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

const { schoolYears, addSchoolYear, formatSchoolYear, removeSchoolYear } =
  useSchoolYears();

const selectedSchoolYear = ref<SchoolYear | undefined>();

function handleSave() {
  const id = selectedSchoolYear.value ? selectedSchoolYear.value.id : undefined;
  const schoolYear: SchoolYear = {
    id: id,
    start: firstStartDate.value,
    end: secondEndDate.value,
    firstSemester: {
      id: undefined,
      type: 1,
      start: firstStartDate.value,
      end: firstEndDate.value,
    },
    secondSemester: {
      id: undefined,
      type: 2,
      start: secondStartDate.value,
      end: secondEndDate.value,
    },
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
    firstStartDate.value = item?.firstSemester?.start;
    firstEndDate.value = item?.firstSemester?.end;
    secondStartDate.value = item?.secondSemester?.start;
    secondEndDate.value = item?.secondSemester?.end;
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
      <div class="container">
        <div>
          <EntityList
            v-model="selectedSchoolYear"
            :entities="schoolYears"
            :format="formatSchoolYear"
          />
        </div>
        <div class="edit-area">
          <p>
            Verwalten Sie hier ihre Schuljahre. Sie können Schuljahre anlegen
            oder bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
            auswählen.
          </p>
          <Divider />
          <CustomTransition>
            <div v-show="selectedSchoolYear">
              <Card class="shadow-2">
                <template #title>Erstes Halbjahr</template>
                <template #content>
                  <div class="label-over-input">
                    <div>
                      <label
                        for="startFirstSemesterField"
                        class="font-semibold"
                      >
                        Start erstes Halbjahr
                      </label>
                      <Calender
                        v-model="firstStartDate"
                        input-id="startFirstSemesterField"
                        class="calender-input"
                        date-format="dd.mm.yy"
                        show-icon
                        show-button-bar
                      />
                    </div>
                    <div>
                      <label
                        for="endFirstSemesterField"
                        class="font-semibold"
                      >
                        Ende erstes Halbjahr
                      </label>
                      <Calender
                        v-model="firstEndDate"
                        input-id="endFirstSemesterField"
                        class="calender-input"
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
                  <div class="label-over-input">
                    <div>
                      <label
                        for="startSecondSemesterField"
                        class="font-semibold"
                      >
                        Start zweites Halbjahr
                      </label>
                      <Calender
                        v-model="secondStartDate"
                        input-id="startSecondSemesterField"
                        class="calender-input"
                        date-format="dd.mm.yy"
                        show-icon
                        show-button-bar
                      />
                    </div>
                    <div>
                      <label
                        for="endSecondSemesterField"
                        class="font-semibold"
                      >
                        Ende zweites Halbjahr
                      </label>
                      <Calender
                        v-model="secondEndDate"
                        input-id="endSecondSemesterField"
                        class="calender-input"
                        date-format="dd.mm.yy"
                        show-icon
                        show-button-bar
                      />
                    </div>
                  </div>
                </template>
              </Card>
              <div class="mt-2 button-area">
                <Button
                  label="Speichern"
                  @click="handleSave"
                />
                <Button
                  v-show="
                    selectedSchoolYear &&
                    selectedSchoolYear.id &&
                    selectedSchoolYear.id > 0
                  "
                  label="Löschen"
                  class="delete-button"
                  @click="handleRemove"
                />
              </div>
            </div>
          </CustomTransition>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-columns: 2fr repeat(10, 1fr);
  column-gap: 1rem;
}

.edit-area {
  grid-column: 3 / span 8;
}

.label-over-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 0.5rem;
}

.calender-input {
  width: 100%;
  margin-top: 0.5rem;
}

.button-area {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
}

.delete-button {
  grid-column: 8 / span 1;
}
</style>
