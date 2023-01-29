const grid = new gridjs.Grid({
    columns: ['Name', 'Max Score', "Weighting", {
        name: 'Actions',
        sort: { enabled: false },
        formatter: (cell, row) => {
            return [gridjs.h('button', {
                className: 'btn btn-primary m-2',
                onClick: () => alert(row.cells[4].data)
            }, `Description`), gridjs.h('button', {
                className: 'btn btn-danger m-2',
                onClick: () => deleteAssignment(row.cells[3].data)
            }, `Remove`)];
        }
    }, {
        name: 'ID',
        hidden: true
        }, {
            name: 'Description',
            hidden: true
        }],
    server: {
        url: '/api/assignments',
        then: data => data.map(assignment => {

            return [assignment.name, assignment.maxScore, `${assignment.weighting * 100}%`, assignment.id, assignment.description]
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

function deleteAssignment(number) {
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
                console.log("Assignment deleted successfully");
                grid.forceRender();
                window.location.reload();
            } else {
                console.log("Error deleting assignment");
                alert("Failed to delete assignment")
            }
        }
    });

    xhr.open("DELETE", "/api/assignment");
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