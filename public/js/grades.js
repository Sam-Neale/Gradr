//Get each form and add an event listener for submit
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        const studentID = data.student;
        delete data['student'];
        //Run through every property in the data object
        let failedRequests = [];
        let requests = 0;
        let completed = 0;
        for (let key in data) {
            requests++;
            const value = data[key];
            //If the value is empty, skip it
            if(value){
                const data = JSON.stringify({
                    "student": studentID,
                    "assignment": key.split("_")[1],
                    "grade": parseFloat(value)
                });

                const xhr = new XMLHttpRequest();
                xhr.withCredentials = true;

                xhr.addEventListener("readystatechange", function () {
                    if (this.readyState === this.DONE) {
                        if(this.status == 200){
                            console.log(`Succesffuly updated ${key} to ${value} for student ${studentID}`)
                        }else{
                            console.log(key.split("_")[1])
                            failedRequests.push(this);
                        }
                        completed++;
                    }
                });

                xhr.open("POST", "/api/grade");
                xhr.setRequestHeader("Content-Type", "application/json");

                xhr.send(data);
            }
        }
        setInterval(() => {
            if(requests == completed){
                if(failedRequests.length > 0){
                    alert(`Failed to update ${failedRequests.length} assignments. Please try again.`);
                    window.location.reload();
                }else{
                    alert("Successfully updated grades!");
                    window.location.reload();
                }
            }else{
                console.log(`Completed ${completed} of ${requests} requests`)
            }
        }, 750);
    });
});

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