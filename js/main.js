const KEY = 'spendwise_goals';
let goals = JSON.parse(localStorage.getItem(KEY)) || [];

function get(id) {
    return document.getElementById(id);
}

function save() {
    localStorage.setItem(KEY, JSON.stringify(goals));
}

function money(value) {
    return Number(value).toLocaleString('vi-VN') + ' đ';
}

function progress(goal) {
    return Math.min(Math.round(goal.saved / goal.target * 100), 100);
}

function status(goal) {
    if (progress(goal) >= 100) return 'done';
    if (new Date(goal.deadline + 'T23:59:59') < new Date()) return 'late';
    return 'doing';
}

function statusText(value) {
    if (value === 'done') return 'Hoàn tất';
    if (value === 'late') return 'Quá hạn';
    return 'Đang thực hiện';
}

function monthsLeft(date) {
    const today = new Date();
    const end = new Date(date + 'T23:59:59');
    const months = (end.getFullYear() - today.getFullYear()) * 12 + end.getMonth() - today.getMonth() + 1;
    return Math.max(months, 1);
}

function findGoal(id) {
    return goals.find(function (goal) {
        return goal.id === Number(id);
    });
}

function render() {
    const search = get('quickSearch').value.toLowerCase();
    const filter = get('statusFilter').value;
    let rows = '';
    let savedTotal = 0;
    let progressTotal = 0;
    let monthlyNeed = 0;
    let shown = 0;

    for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        const percent = progress(goal);
        const goalStatus = status(goal);

        savedTotal += goal.saved;
        progressTotal += percent;

        if (goalStatus === 'doing') {
            monthlyNeed += (goal.target - goal.saved) / monthsLeft(goal.deadline);
        }

        const nameMatch = goal.name.toLowerCase().includes(search);
        const statusMatch = filter === 'all' || goalStatus === filter;

        if (!nameMatch || !statusMatch) continue;

        shown++;
        rows += `
            <tr>
                <td><span class="goal-name">${goal.name}</span><br><small>${money(goal.saved)} / ${money(goal.target)}</small></td>
                <td>
                    <div class="progress-track"><div class="progress-bar" style="width:${percent}%"></div></div>
                    <span class="progress-text">${percent}%</span>
                </td>
                <td>${goal.deadline}</td>
                <td><span class="status status-${goalStatus}">${statusText(goalStatus)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="small-button" data-action="contribute" data-id="${goal.id}">Góp thêm</button>
                        <button class="small-button" data-action="coach" data-id="${goal.id}">AI Coach</button>
                        <button class="small-button" data-action="edit" data-id="${goal.id}">Sửa</button>
                        <button class="small-button danger-button" data-action="delete" data-id="${goal.id}">Xóa</button>
                    </div>
                </td>
            </tr>`;
    }

    get('goalTableBody').innerHTML = rows;
    get('emptyMessage').style.display = shown ? 'none' : 'block';
    get('totalGoals').textContent = goals.length;
    get('totalSaved').textContent = money(savedTotal);
    get('averageProgress').textContent = goals.length ? Math.round(progressTotal / goals.length) + '%' : '0%';
    get('monthlyNeed').textContent = money(Math.round(monthlyNeed));
}

function showModal(id, show) {
    get(id).classList.toggle('show', show);
}

function openGoalModal(id) {
    const goal = findGoal(id);

    get('goalForm').reset();
    get('goalId').value = '';
    get('formMessage').textContent = '';
    get('modalTitle').textContent = goal ? 'Sửa mục tiêu' : 'Thêm mục tiêu';

    if (goal) {
        get('goalId').value = goal.id;
        get('goalName').value = goal.name;
        get('targetAmount').value = goal.target;
        get('savedAmount').value = goal.saved;
        get('deadline').value = goal.deadline;
    }

    showModal('goalModal', true);
}

get('goalForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const id = get('goalId').value;
    const name = get('goalName').value.trim();
    const target = Number(get('targetAmount').value);
    const saved = Number(get('savedAmount').value);
    const deadline = get('deadline').value;
    let error = '';

    if (!name) error = 'Vui lòng nhập tên mục tiêu.';
    else if (target <= 0) error = 'Số tiền mục tiêu phải lớn hơn 0.';
    else if (saved < 0) error = 'Số tiền đã tiết kiệm không được âm.';
    else if (saved > target) error = 'Số tiền đã tiết kiệm không được lớn hơn mục tiêu.';
    else if (!deadline) error = 'Vui lòng chọn kỳ hạn.';

    if (error) {
        get('formMessage').textContent = error;
        return;
    }

    const data = {
        id: id ? Number(id) : Date.now(),
        name: name,
        target: target,
        saved: saved,
        deadline: deadline
    };

    if (id) {
        const oldGoal = findGoal(id);
        Object.assign(oldGoal, data);
    } else {
        goals.push(data);
    }

    save();
    showModal('goalModal', false);
    render();
});

function deleteGoal(id) {
    const goal = findGoal(id);
    if (!goal || !confirm('Bạn có chắc muốn xóa mục tiêu "' + goal.name + '" không?')) return;

    goals = goals.filter(function (item) {
        return item.id !== Number(id);
    });

    save();
    render();
}

function openContribute(id) {
    get('contributeGoalId').value = id;
    get('contributeAmount').value = '';
    get('contributeMessage').textContent = '';
    showModal('contributeModal', true);
}

get('contributeForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const goal = findGoal(get('contributeGoalId').value);
    const amount = Number(get('contributeAmount').value);

    if (amount <= 0) {
        get('contributeMessage').textContent = 'Số tiền góp thêm phải lớn hơn 0.';
        return;
    }

    goal.saved = Math.min(goal.saved + amount, goal.target);
    save();
    showModal('contributeModal', false);
    render();
});

function showCoach(id) {
    const goal = findGoal(id);
    const remaining = goal.target - goal.saved;

    if (remaining <= 0) {
        get('coachText').textContent = 'Mục tiêu "' + goal.name + '" đã hoàn thành. Bạn có thể tạo mục tiêu mới.';
        return;
    }

    const months = monthsLeft(goal.deadline);
    const monthly = Math.ceil(remaining / months);

    get('coachText').textContent =
        'Mục tiêu "' + goal.name + '" đang đạt ' + progress(goal) + '%. ' +
        'Bạn còn thiếu ' + money(remaining) + '. Nếu chia đều trong khoảng ' + months +
        ' tháng, hãy tiết kiệm khoảng ' + money(monthly) + ' mỗi tháng.';
}

get('goalTableBody').addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === 'edit') openGoalModal(id);
    if (action === 'delete') deleteGoal(id);
    if (action === 'contribute') openContribute(id);
    if (action === 'coach') showCoach(id);
});

get('quickSearch').addEventListener('input', render);
get('statusFilter').addEventListener('change', render);
get('openAddModal').addEventListener('click', function () {
    openGoalModal();
});

get('closeModal').addEventListener('click', function () {
    showModal('goalModal', false);
});

get('cancelModal').addEventListener('click', function () {
    showModal('goalModal', false);
});

get('closeContribute').addEventListener('click', function () {
    showModal('contributeModal', false);
});

get('cancelContribute').addEventListener('click', function () {
    showModal('contributeModal', false);
});

get('menuButton').addEventListener('click', function () {
    get('sidebar').classList.toggle('show');
});

render();
