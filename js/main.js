const KEY = 'spendwise_goals';
let goals = JSON.parse(localStorage.getItem(KEY)) || [];

const $ = function (id) {
    return document.getElementById(id);
};

function money(value) {
    return Number(value).toLocaleString('vi-VN') + ' đ';
}

function percent(goal) {
    return Math.min(Math.round(goal.saved / goal.target * 100), 100);
}

function goalStatus(goal) {
    if (percent(goal) >= 100) return 'done';
    if (new Date(goal.deadline + 'T23:59:59') < new Date()) return 'late';
    return 'doing';
}

function statusText(status) {
    if (status === 'done') return 'Hoàn tất';
    if (status === 'late') return 'Quá hạn';
    return 'Đang thực hiện';
}

function monthsLeft(date) {
    const now = new Date();
    const end = new Date(date);
    const months = (end.getFullYear() - now.getFullYear()) * 12 + end.getMonth() - now.getMonth() + 1;
    return Math.max(months, 1);
}

function save() {
    localStorage.setItem(KEY, JSON.stringify(goals));
}

function findGoal(id) {
    return goals.find(function (goal) {
        return goal.id === Number(id);
    });
}

function render() {
    const search = $('search').value.toLowerCase();
    const filter = $('filter').value;
    let html = '';
    let saved = 0;
    let totalPercent = 0;
    let monthly = 0;

    for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        const status = goalStatus(goal);
        const p = percent(goal);

        saved += goal.saved;
        totalPercent += p;

        if (status === 'doing') {
            monthly += (goal.target - goal.saved) / monthsLeft(goal.deadline);
        }

        if (!goal.name.toLowerCase().includes(search)) continue;
        if (filter !== 'all' && filter !== status) continue;

        html += `
            <tr>
                <td><b>${goal.name}</b><br>${money(goal.saved)} / ${money(goal.target)}</td>
                <td><div class="bar"><div style="width:${p}%"></div></div>${p}%</td>
                <td>${goal.deadline}</td>
                <td><span class="status ${status}">${statusText(status)}</span></td>
                <td>
                    <button class="small" data-action="add" data-id="${goal.id}">Góp thêm</button>
                    <button class="small" data-action="coach" data-id="${goal.id}">AI Coach</button>
                    <button class="small" data-action="edit" data-id="${goal.id}">Sửa</button>
                    <button class="small delete" data-action="delete" data-id="${goal.id}">Xóa</button>
                </td>
            </tr>`;
    }

    $('list').innerHTML = html;
    $('empty').style.display = html ? 'none' : 'block';
    $('count').textContent = goals.length;
    $('savedTotal').textContent = money(saved);
    $('progressTotal').textContent = goals.length ? Math.round(totalPercent / goals.length) + '%' : '0%';
    $('monthlyTotal').textContent = money(Math.round(monthly));
}

function openForm(goal) {
    $('form').reset();
    $('message').textContent = '';
    $('formTitle').textContent = goal ? 'Sửa mục tiêu' : 'Thêm mục tiêu';
    $('id').value = goal ? goal.id : '';

    if (goal) {
        $('name').value = goal.name;
        $('target').value = goal.target;
        $('saved').value = goal.saved;
        $('deadline').value = goal.deadline;
    }

    $('modal').classList.add('show');
}

function closeForm() {
    $('modal').classList.remove('show');
}

$('form').addEventListener('submit', function (event) {
    event.preventDefault();

    const id = $('id').value;
    const name = $('name').value.trim();
    const target = Number($('target').value);
    const saved = Number($('saved').value);
    const deadline = $('deadline').value;

    if (!name || target <= 0 || saved < 0 || !deadline) {
        $('message').textContent = 'Vui lòng nhập đầy đủ và đúng dữ liệu.';
        return;
    }

    if (saved > target) {
        $('message').textContent = 'Tiền đã tiết kiệm không được lớn hơn mục tiêu.';
        return;
    }

    const data = {
        id: id ? Number(id) : Date.now(),
        name: name,
        target: target,
        saved: saved,
        deadline: deadline
    };

    if (id) Object.assign(findGoal(id), data);
    else goals.push(data);

    save();
    closeForm();
    render();
});

$('list').addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;
    const goal = findGoal(id);

    if (action === 'edit') openForm(goal);

    if (action === 'add') {
        const amount = Number(prompt('Nhập số tiền muốn góp thêm:'));
        if (amount > 0) {
            goal.saved = Math.min(goal.saved + amount, goal.target);
            save();
            render();
        }
    }

    if (action === 'coach') {
        const remain = goal.target - goal.saved;

        if (remain <= 0) {
            $('coachText').textContent = 'Mục tiêu "' + goal.name + '" đã hoàn thành.';
        } else {
            const months = monthsLeft(goal.deadline);
            const monthly = Math.ceil(remain / months);
            $('coachText').textContent = 'Bạn còn thiếu ' + money(remain) + '. Hãy tiết kiệm khoảng ' + money(monthly) + ' mỗi tháng trong ' + months + ' tháng.';
        }
    }

    if (action === 'delete' && confirm('Xóa mục tiêu "' + goal.name + '"?')) {
        goals = goals.filter(function (item) {
            return item.id !== Number(id);
        });
        save();
        render();
    }
});

$('add').addEventListener('click', function () {
    openForm();
});

$('close').addEventListener('click', closeForm);
$('cancel').addEventListener('click', closeForm);
$('search').addEventListener('input', render);
$('filter').addEventListener('change', render);

render();
