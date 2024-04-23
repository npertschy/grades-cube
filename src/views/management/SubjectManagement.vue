<script setup lang="ts">
import CustomTransition from "@/components/layout/CustomTransition.vue";
import EntityList from "@/components/layout/EntityList.vue";
import SaveAndDeleteButtons from "@/components/layout/SaveAndDeleteButtons.vue";
import InputWithLabel from "@/components/layout/InputWithLabel.vue";
import ManagementPanel from "@/components/layout/ManagementPanel.vue";
import Card from "primevue/card";
import Divider from "primevue/divider";
import { ref, watch } from "vue";
import { useSubjects } from "@/components/subjects/SubjectStore";
import type { Subject } from "@/components/subjects/Subject";

const name = ref<string>();

const { subjects, addSubject, formatSubject, removeSubject, editSubject } =
  useSubjects();

const selectedSubject = ref<Subject | undefined>();

async function handleSave() {
  if (selectedSubject.value?.id) {
    const subject: Subject = {
      id: selectedSubject.value.id,
      name: name.value,
    };

    await editSubject(subject, () => {
      resetInputs();
      selectedSubject.value = undefined;
    });
  } else {
    const subject: Subject = {
      id: undefined,
      name: name.value,
    };
    await addSubject(subject, () => {
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
  <management-panel header="Fächer verwalten">
    <template #list>
      <entity-list
        v-model="selectedSubject"
        :entities="subjects"
        :format="formatSubject"
      />
    </template>
    <template #edit>
      <p>
        Verwalten Sie hier ihre Fächer. Sie können Fächer anlegen oder
        bearbeiten, indem Sie den entsprechenden Eintrag in der Liste auswählen.
      </p>
      <divider />
      <custom-transition>
        <div v-show="selectedSubject">
          <card class="shadow-2">
            <template #title>Fach</template>
            <template #content>
              <input-with-label
                v-model="name"
                identifier="nameField"
                label="Name"
              />
            </template>
          </card>

          <save-and-delete-buttons
            :show-delete-when-defined="selectedSubject"
            :save-action="handleSave"
            :delete-action="handleRemove"
          />
        </div>
      </custom-transition>
    </template>
  </management-panel>
</template>
