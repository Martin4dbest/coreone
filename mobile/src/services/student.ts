import api from "./api";


export async function getStudentProfile(){
    const response = await api.get(
        "/students/me"
    );

    return response.data;
}


export async function getStudentOverview(){
    const response = await api.get(
        "/students/dashboard"
    );

    return response.data;
}


export async function getStudentAttendance(){
    const response = await api.get(
        "/students/attendance"
    );

    return response.data;
}


export async function getStudentResults(){
    const response = await api.get(
        "/mobile/student/results"
    );

    return response.data;
}


export async function getStudentAssignments(){
    const response = await api.get(
        "/assignments/student"
    );

    return response.data;
}


export async function getStudentCBT(){
    const response = await api.get(
        "/cbt/student"
    );

    return response.data;
}


export async function getStudentEbooks(){
    const response = await api.get(
        "/ebooks"
    );

    return response.data;
}
