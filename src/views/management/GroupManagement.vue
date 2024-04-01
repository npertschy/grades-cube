<script setup lang="ts">
import InputText from "primevue/inputtext";
import InputGroup from "primevue/inputgroup";
import AutoComplete, {
  type AutoCompleteCompleteEvent,
} from "primevue/autocomplete";
import Listbox from "primevue/listbox";
import Button from "primevue/button";
import Card from "primevue/card";
import Divider from "primevue/divider";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { ref, watch } from "vue";
import type { Pupil } from "@/components/pupils/Pupil";
import { usePupils } from "@/components/pupils/PupilStore";

const name = ref<string>();
const pupil = ref<Pupil>();

const { pupils, format } = usePupils();
const pupilList = ref([...pupils.value]);

const idCounter = ref(1);

type Group = {
  id: number;
  name: string | undefined;
  pupils: Pupil[];
};

const groups = ref<Group[]>([
  {
    id: 0,
    name: undefined,
    pupils: [],
  },
]);

const selectedGroup = ref<Group | undefined>();
const selectedPupil = ref<Pupil | undefined>();

function addGroup() {
  if (selectedGroup.value && selectedGroup.value.id > 0) {
    const group = {
      id: selectedGroup.value.id,
      name: name.value,
      pupils: [],
    };

    const index = groups.value.findIndex((it) => {
      return it.id == group.id;
    });

    groups.value.splice(index, 1, group);
  } else {
    groups.value?.push({
      id: idCounter.value,
      name: name.value,
      pupils: [],
    });

    idCounter.value++;
  }

  resetInputs();
  selectedGroup.value = undefined;
}

watch(selectedGroup, (current) => loadGroup(current));

function resetInputs() {
  name.value = undefined;
}

function loadGroup(item: Group | undefined) {
  resetInputs();
  if (item?.id && item.id > 0) {
    name.value = item?.name;
  }
}

function formatGroup(item: Group) {
  return item.id === 0 ? "Neue Klasse anlegen" : item.name;
}

function removeGroup() {
  const index = groups.value.findIndex((it) => {
    return it.id == selectedGroup.value?.id;
  });

  groups.value.splice(index, 1);
}

function addPupilToGroup() {
  if (pupil.value) {
    selectedGroup.value?.pupils.push(pupil.value);
    pupil.value = undefined;
  }
}

function searchPupils(event: AutoCompleteCompleteEvent) {
  if (event.query === "") {
    pupilList.value = [...pupils.value];
  } else {
    pupilList.value = pupils.value.filter((it) => {
      return (
        it.firstName?.includes(event.query) ||
        it.lastName?.includes(event.query)
      );
    });
  }
}
</script>

<template>
  <Card>
    <template #title>Klassen verwalten</template>
    <template #content>
      <div class="grid nested-grid">
        <div class="col-2">
          <Listbox
            v-model="selectedGroup"
            :options="groups"
            class="min-h-full shadow-2"
          >
            <template #option="slotProps">
              <p class="text-center">
                {{ formatGroup(slotProps.option) }}
              </p>
            </template>
          </Listbox>
        </div>
        <div class="col-offset-1 col-8">
          <p>
            Verwalten Sie hier ihre Klassen. Sie können Klassen anlegen oder
            bearbeiten, indem Sie den entsprechenden Eintrag in der Liste
            auswählen.
          </p>
          <Divider />
          <div v-show="selectedGroup" class="grid gap-2">
            <div class="col-4">
              <div class="grid">
                <Card class="shadow-2 col-12">
                  <template #title>Klasse</template>
                  <template #content>
                    <div class="formgrid grid">
                      <div class="field col">
                        <label for="nameField" class="font-semibold"
                          >Name</label
                        >
                        <InputText
                          input-id="nameField"
                          v-model="name"
                          class="w-full"
                        />
                      </div>
                    </div>
                  </template>
                </Card>
                <div class="mt-2 col-12">
                  <Button label="Submit" class="col-3" @click="addGroup" />
                  <Button
                    v-show="selectedGroup && selectedGroup.id > 0"
                    label="Delete"
                    class="col-3 col-offset-6"
                    @click="removeGroup"
                  />
                </div>
              </div>
            </div>
            <div v-show="selectedGroup && selectedGroup.id > 0" class="col">
              <div class="grid">
                <Card class="shadow-2 col-12">
                  <template #title>Schüler</template>
                  <template #content>
                    <DataTable
                      :value="selectedGroup?.pupils"
                      v-model:selection="selectedPupil"
                      data-key="id"
                      selection-mode="single"
                    >
                      <Column header="#">
                        <template #body="slotProps">
                          {{ slotProps.index }}
                        </template>
                      </Column>
                      <Column header="Name">
                        <template #body="slotProps">
                          {{ slotProps.data.firstName }}
                          {{ slotProps.data.lastName }}
                        </template>
                      </Column>
                    </DataTable>
                    <div class="formgrid grid mt-2">
                      <div class="field col">
                        <label for="pupilName" class="font-semibold"
                          >Schüler zur Klasse hinzufügen</label
                        >
                        <InputGroup>
                          <AutoComplete
                            input-id="pupilName"
                            v-model="pupil"
                            :option-label="format"
                            :suggestions="pupilList"
                            class="w-full"
                            force-selection
                            @complete="searchPupils"
                          >
                            <template #option="slotProps">
                              <span>{{ format(slotProps.option) }}</span>
                            </template>
                          </AutoComplete>
                          <Button
                            icon="pi pi-check"
                            security="success"
                            @click="addPupilToGroup"
                          />
                        </InputGroup>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>
