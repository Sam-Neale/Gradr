const grid = new gridjs.Grid({
    columns: ['Number', 'Name', {
        name: 'Actions',
        sort: { enabled: false },
        formatter: (cell, row) => {
            return [gridjs.h('button', {
                className: 'btn btn-primary m-2',
                onClick: () => renameStudent(row.cells[0].data)
            }, `Rename`), gridjs.h('button', {
                className: 'btn btn-danger m-2',
                onClick: () => deleteStudent(row.cells[0].data)
            }, `Remove`)];
        }
    }],
    server: {
        url: '/api/students',
        then: data => data.map(student => {
            console.log(student);

            return [student.id, student.name]
        })
    },
    search: {
        enabled: true
    },
    language: {
        'search': {
            'placeholder': '🔍 Search...'
        }
    },
    style: {
        table: {
            width: '100%'
        },
        td: {
            overflowX: "scroll"
        }
    },
    className: {
        td: 'grid-td',
    },
    sort: true,
    pagination: {
        enabled: true,
        limit: 10,
        summary: true
    }
}).render(document.getElementById("wrapper"));

function deleteStudent(number) {
    //Make a DELETE request to /api/student with the id (number) as a JSON body
    const data = JSON.stringify({
        "id": number
    });

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            const statusCode = this.status;
            if (statusCode === 200) {
                console.log("Student deleted successfully");
                grid.forceRender();
            } else {
                console.log("Error deleting student");
                alert("Failed to delete student")
            }
        }
    });

    xhr.open("DELETE", "/api/student");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send(data);
}

(function () {
    'use strict'
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.querySelectorAll('.needs-validation')
    // Loop over them and prevent submission
    Array.prototype.slice.call(forms)
        .forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }
                form.classList.add('was-validated')
            }, false)
        })
})();

function renameStudent(id){
    const newName = prompt(`Enter the new name for student ${id}`);
    if (newName === null) {
        return;
    }else{
        const data = JSON.stringify({
            "name": newName,
            "id": id
        });

        const xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === this.DONE) {
                if(this.status == 200){
                    console.log("Student renamed successfully");
                    grid.forceRender();
                }else{
                    alert("Failed to rename student");
                    console.error([this.status, this.statusText]);
                }
            }
        });

        xhr.open("PUT", "/api/student/name");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.send(data);
    }
}