<script setup lang="ts">
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import Button from "primevue/button";
import Card from "primevue/card";
import Divider from "primevue/divider";
import { ref, watch } from "vue";
import { useSubjects } from "@/components/subjects/SubjectStore";
import type { Subject } from "@/components/subjects/Subject";

const name = ref<string>();

const { subjects, addSubject, formatSubject, removeSubject, editSubject } =
  useSubjects();

const selectedSubject = ref<Subject | undefined>();

function handleSave() {
  if (selectedSubject.value) {
    const subject: Subject = {
      id: selectedSubject.value.id,
      name: name.value,
    };

    editSubject(subject, () => {
      resetInputs();
      selectedSubject.value = undefined;
    });
  } else {
    const subject: Subject = {
      id: undefined,
      name: name.value,
    };

    addSubject(subject, () => {
      resetInputs();
      selectedSubject.value = undefined;
    });
  }
}

watch(selectedSubject, (current) => loadSubject(current));

function resetInputs() {
  name.value = undefined;
}

function loadSubject(item: Subject | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    name.value = item?.name;
  }
}

function handleRemove() {
  if (selectedSubject.value) {
    removeSubject(selectedSubject.value, () => {
      resetInputs();
      selectedSubject.value = undefined;
    });
  }
}
</script>

<template>
  <Card>
    <template #title>Fächer verwalten</template>
    <template #content>
      <div class="container">
        <div>
          <Listbox
            v-model="selectedSubject"
            :options="subjects"
            class="shadow-2"
          >
            <template #option="slotProps">
              <p class="text-center">
                {{ formatSubject(slotProps.option) }}
              </p>
            </template>
          </Listbox>
        </div>
        <div class="edit-area">
          <p>
            Verwalten Sie hier ihre Fächer. Sie können Fächer anlegen oder
            bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
            auswählen.
          </p>
          <Divider />
          <div v-show="selectedSubject">
            <Card class="shadow-2">
              <template #title>Fach</template>
              <template #content>
                <div class="label-over-input">
                  <div>
                    <label for="nameField" class="font-semibold">Name</label>
                    <InputText
                      input-id="nameField"
                      v-model="name"
                      class="w-full"
                    />
                  </div>
                </div>
              </template>
            </Card>

            <div class="mt-2 button-area">
              <Button label="Submit" @click="handleSave" />
              <Button
                v-show="
                  selectedSubject &&
                  selectedSubject.id &&
                  selectedSubject.id > 0
                "
                label="Delete"
                class="delete-button"
                @click="handleRemove"
              />
            </div>
          </div>
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
  grid-template-columns: auto;
}

.button-area {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
}

.delete-button {
  grid-column: 8 / span 1;
}
</style>
