<script setup lang="ts">
import InputText from "primevue/inputtext";
import Listbox from "primevue/listbox";
import Button from "primevue/button";
import Card from "primevue/card";
import Divider from "primevue/divider";
import { ref, watch } from "vue";

const name = ref<string>();

const idCounter = ref(1);

type Subject = {
  id: number;
  name: string | undefined;
};

const subjects = ref<Subject[]>([
  {
    id: 0,
    name: undefined,
  },
]);

const selectedSubject = ref<Subject | undefined>();

function addSubject() {
  if (selectedSubject.value && selectedSubject.value.id > 0) {
    const subject = {
      id: selectedSubject.value.id,
      name: name.value,
    };

    const index = subjects.value.findIndex((it) => {
      return it.id == subject.id;
    });

    subjects.value.splice(index, 1, subject);
  } else {
    subjects.value?.push({
      id: idCounter.value,
      name: name.value,
    });

    idCounter.value++;
  }

  resetInputs();
  selectedSubject.value = undefined;
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

function format(item: Subject) {
  return item.id === 0 ? "Neues Fach anlegen" : item.name;
}

function removeSubject() {
  const index = subjects.value.findIndex((it) => {
    return it.id == selectedSubject.value?.id;
  });

  subjects.value.splice(index, 1);
}
</script>

<template>
  <Card>
    <template #title>Fächer verwalten</template>
    <template #content>
      <div class="grid">
        <div class="col-2">
          <Listbox
            v-model="selectedSubject"
            :options="subjects"
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
            Verwalten Sie hier ihre Fächer. Sie können Fächer anlegen oder
            bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
            auswählen.
          </p>
          <Divider />
          <div v-show="selectedSubject">
            <Card class="shadow-2">
              <template #title>Fach</template>
              <template #content>
                <div class="formgrid grid">
                  <div class="field col">
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

            <div class="mt-2">
              <Button label="Submit" class="col-1" @click="addSubject" />
              <Button
                v-show="selectedSubject && selectedSubject.id > 0"
                label="Delete"
                class="col-offset-10 col-1"
                @click="removeSubject"
              />
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
