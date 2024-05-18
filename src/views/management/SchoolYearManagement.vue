<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import DatePicker from "primevue/datepicker";
import Card from "primevue/card";
import Divider from "primevue/divider";
import { ref, watch } from "vue";
import { type SchoolYear } from "@/components/schoolYears/SchoolYear";
import { useSchoolYears } from "@/components/schoolYears/SchoolYearStore";
import { useRoute } from "vue-router";

const route = useRoute();

const firstStartDate = ref<Date>();
const firstEndDate = ref<Date>();
const secondStartDate = ref<Date>();
const secondEndDate = ref<Date>();

const { schoolYears, addSchoolYear, formatSchoolYear, removeSchoolYear } =
  useSchoolYears();

const selectedSchoolYear = ref<SchoolYear | undefined>();
if (route.query["index"]) {
  selectedSchoolYear.value = schoolYears.value[+route.query["index"]];
}

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
  <management-panel header="Schuljahre verwalten">
    <template #list>
      <div>
        <entity-list
          v-model="selectedSchoolYear"
          :entities="schoolYears"
          :format="formatSchoolYear"
        />
      </div>
    </template>
    <template #edit>
      <p>
        Verwalten Sie hier ihre Schuljahre. Sie können Schuljahre anlegen oder
        bearbeiten, indem Sie den entsprechenden Eintrag in der Liste auswählen.
      </p>
      <divider />
      <custom-transition>
        <div v-show="selectedSchoolYear">
          <card class="shadow-2">
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
                  <date-picker
                    v-model="firstStartDate"
                    input-id="startFirstSemesterField"
                    class="calender-input"
                    date-format="dd.mm.yy"
                    show-icon
                    icon-display="input"
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
                  <date-picker
                    v-model="firstEndDate"
                    input-id="endFirstSemesterField"
                    class="calender-input"
                    date-format="dd.mm.yy"
                    show-icon
                    icon-display="input"
                    show-button-bar
                  />
                </div>
              </div>
            </template>
          </card>
          <card class="shadow-2 mt-2">
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
                  <date-picker
                    v-model="secondStartDate"
                    input-id="startSecondSemesterField"
                    class="calender-input"
                    date-format="dd.mm.yy"
                    show-icon
                    icon-display="input"
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
                  <date-picker
                    v-model="secondEndDate"
                    input-id="endSecondSemesterField"
                    class="calender-input"
                    date-format="dd.mm.yy"
                    show-icon
                    icon-display="input"
                    show-button-bar
                  />
                </div>
              </div>
            </template>
          </card>
          <save-and-delete-buttons
            :show-delete-when-defined="selectedSchoolYear"
            :save-action="handleSave"
            :delete-action="handleRemove"
          />
        </div>
      </custom-transition>
    </template>
  </management-panel>
</template>

<style scoped>
.label-over-input {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 0.5rem;
}

.calender-input {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
