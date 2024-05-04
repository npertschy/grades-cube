import { afterEach, describe, expect, it, vi } from "vitest";
import type { SchoolYear } from "@/components/schoolYears/SchoolYear";
import type { Subject } from "@/components/subjects/Subject";
import { SubjectGateway } from "@/components/subjects/SubjectGateway";

const { mockedDb, mockedExecute, mockedNextPrimaryKey } = vi.hoisted(() => ({
    mockedDb: vi.fn(),
    mockedExecute: vi.fn(),
    mockedNextPrimaryKey: vi.fn()

}))

vi.mock("@/store/Database", () => {
    return {
        db: mockedDb,
        execute: mockedExecute,
        nextPrimaryKey: mockedNextPrimaryKey
    }
});


describe("SubjectManagement", () => {
    describe("testing create subject", () => {
        afterEach(() => {
            vi.restoreAllMocks()
        })
        it("should create a new subject when subject by name is not present yet", () => {

            const sut = new SubjectGateway();

            const subject: Subject = {
                id: undefined,
                name: "Deutsch"
            }

            const schoolYear: SchoolYear = {
                id: 1,
                start: undefined,
                end: undefined,
                firstSemester: undefined,
                secondSemester: undefined
            }



            sut.createSubjectForSchoolYear(subject, schoolYear)


            // nextPrimaryKey.mockImplementationOnce(() => 1);
            // expect(mockedNextPrimaryKey).toHaveBeenCalledWith("Subject")

            // execute.mockImplementationOnce(async () => { Promise.resolve({}) })
            // expect(mockedExecute).toHaveBeenCalledTimes(1)
        })
    })
})
