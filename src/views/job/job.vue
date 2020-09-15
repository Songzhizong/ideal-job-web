<template>
  <div class="app-container">
    <div class="filter-container">

      <el-select
        v-model="listQuery.workerId"
        clearable placeholder="选择执行器"
        style="width: 200px; margin-right: 1em;"
        @change="handleFilter">
        <el-option
          v-for="item in workerList"
          :key="item.workerId"
          :label="item.title"
          :value="item.workerId">
          <span>{{ item.title + ' - ' }}</span>
          <span style="color: #8492a6; font-size: 13px">{{ item.appName }}</span>
        </el-option>
      </el-select>

      <el-select
        v-model="listQuery.jobStatus"
        clearable placeholder="任务状态"
        style="width: 140px; margin-right: 1em;"
        @change="handleFilter">
        <el-option
          key="1"
          label="启用"
          value="1">
        </el-option>
        <el-option
          key="0"
          label="停用"
          value="0">
        </el-option>
      </el-select>

      <el-input
        v-model="listQuery.jobName"
        placeholder="任务名称"
        style="width: 200px; margin-right: 1em;"
        class="filter-item"
        @keyup.enter.native="handleFilter"/>

      <el-input
        v-model="listQuery.executorHandler"
        placeholder="Job Handler"
        style="width: 200px; margin-right: 2em;"
        class="filter-item"
        @keyup.enter.native="handleFilter"/>
      <el-button circle
                 icon="el-icon-refresh" class="filter-item"
                 type="primary"
                 style="margin-right: 1em"
                 @click="resetListQuery"/>

      <el-button circle
                 icon="el-icon-search" class="filter-item"
                 type="primary"
                 style="margin-right: 1em"
                 @click="handleFilter"/>

      <el-button circle
                 class="filter-item"
                 type="primary"
                 icon="el-icon-plus"
                 @click="handleCreate"/>
    </div>
    <p></p>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;">

      <!--      <el-table-column-->
      <!--          label="ID"-->
      <!--          prop="id"-->
      <!--          align="center"-->
      <!--          width="220px">-->
      <!--        <template slot-scope="{row}">-->
      <!--          <span>{{ row.workerId }}</span>-->
      <!--        </template>-->
      <!--      </el-table-column>-->

      <el-table-column
        label="任务名称"
        prop="title"
        align="center"
        width="180px">
        <template slot-scope="{row}">
          <span>{{ row.jobName }}</span>
        </template>
      </el-table-column>

      <el-table-column
        label="执行模式"
        prop="appName"
        align="center"
        min-width="200px">
        <template slot-scope="{row}">
          <span v-if="row.executeType==='BEAN'">
            <b>BEAN : </b>{{ row.executorHandler }}
          </span>
          <span v-if="row.executeType==='HTTP'"><b>Http Script</b></span>
          <span v-if="row.executeType==='LB_HTTP'"><b>Spring Cloud Http Script</b></span>
        </template>
      </el-table-column>

      <el-table-column label="任务状态" class-name="status-col" align="center" width="110px">
        <template slot-scope="{row}">
          <el-tag :type="row.jobStatus | statusFilter" v-if="row.jobStatus===0"><b>STOP</b></el-tag>
          <el-tag :type="row.jobStatus | statusFilter" v-if="row.jobStatus===1"><b>START</b>
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="Cron"
        prop="appName"
        align="center"
        min-width="160px">
        <template slot-scope="{row}">
          <span>{{ row.cron }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="下次调度时间"
        prop="appName"
        align="center"
        width="200px">
        <template slot-scope="{row}">
          <!--suppress JSUnresolvedVariable -->
          <span v-if="row.nextTriggerTime!==null&&row.nextTriggerTime!==undefined">
            {{ row.nextTriggerTime }}
          </span>
          <span v-else>N/A</span>
        </template>
      </el-table-column>

      <el-table-column
        label="操作"
        align="center"
        width="280px"
        class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button
            icon="el-icon-notebook-2"
            type="primary"
            size="mini"
            plain
            @click="handleQueryLog(row)">记录
          </el-button>
          <el-button
            icon="el-icon-video-play"
            type="success"
            size="mini"
            v-if="row.jobStatus===0"
            plain
            @click="handleEnable(row)">启用
          </el-button>
          <el-button
            icon="el-icon-video-pause"
            type="info"
            size="mini"
            v-if="row.jobStatus===1"
            plain
            @click="handleDisable(row)">停用
          </el-button>

          <el-dropdown>
            <el-button
              type="primary"
              size="mini"
              style="margin-left: 1em">
              更多<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                icon="el-icon-thumb"
                @click.native="handleTrigger(row)">触发
              </el-dropdown-item>
              <el-dropdown-item
                icon="el-icon-edit-outline"
                @click.native="handleUpdate(row)">编辑
              </el-dropdown-item>
              <el-dropdown-item
                icon="el-icon-delete"
                style="color: #ff0000"
                @click.native="handleDelete(row)"
                divided>删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.size"
      @pagination="getList"/>

    <el-dialog width="900px" :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="right"
        label-width="100px"
        style="margin-left:10px; margin-right: 20px">

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="执行器" prop="workerId">
              <el-select
                v-model="temp.workerId"
                clearable placeholder="选择执行器"
                style="width: 250px; margin-right: 1em;">
                <el-option
                  v-for="item in workerList"
                  :key="item.workerId"
                  :label="item.title"
                  :value="item.workerId">
                  <span>{{ item.title + ' - ' }}</span>
                  <span style="color: #8492a6; font-size: 13px">{{ item.appName }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务名称" prop="jobName">
              <el-input v-model="temp.jobName"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="路由策略" prop="routeStrategy">
              <el-select
                v-model="temp.routeStrategy"
                clearable placeholder="选择路由策略"
                style="width: 250px; margin-right: 1em;">
                <el-option
                  v-for="item in routeStrategy"
                  :key="item.name"
                  :label="item.label"
                  :value="item.name"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Cron" prop="cron">
              <el-input v-model="temp.cron"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="执行模式" prop="executeType">
              <el-select
                v-model="temp.executeType"
                clearable placeholder="选择执行器"
                style="width: 250px; margin-right: 1em;">
                <el-option
                  v-for="item in executeType"
                  :key="item.name"
                  :label="item.label"
                  :value="item.name"/>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="JobHandler"
              :prop="temp.executeType==='BEAN'?'executorHandler':''">
              <el-input
                v-model="temp.executorHandler"
                :disabled="temp.executeType!=='BEAN'"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="执行参数" prop="executeParam">
          <el-input type="textarea"
                    :rows="8"
                    v-model="temp.executeParam"/>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="dialogStatus==='create'?createData():updateData()">确定
        </el-button>
      </div>
    </el-dialog>

    <el-dialog width="450px" title="确认删除" :visible.sync="deleteJobDialog">
      <p>请输入任务ID: <code style="color: indianred;">{{ temp.jobId }}</code> 以确认删除该任务.</p>
      <el-input v-model="deleteJobId" v-focus></el-input>
      <p></p>
      <!--      <el-button-->
      <!--          type="primary"-->
      <!--          @click="deleteData">确定-->
      <!--      </el-button>-->
      <el-button
        size="small"
        round
        style="width: 100%"
        type="danger"
        plain
        :disabled="deleteJobId!==temp.jobId"
        @click="deleteData">我确认删除该任务
      </el-button>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel"/>
        <el-table-column prop="pv" label="Pv"/>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">
          确认
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  query,
  create,
  update,
  remove,
  enable,
  disable,
  trigger,
} from "@/api/job";
import {
  query as queryExecutor,
} from "@/api/executor";
import waves from "@/directive/waves"; // waves directive
import Pagination from "@/components/Pagination";

// noinspection SpellCheckingInspection
const calendarTypeOptions = [
  {key: "CN", display_name: "China"},
  {key: "US", display_name: "USA"},
  {key: "JP", display_name: "Japan"},
  {key: "EU", display_name: "Eurozone"},
];

// arr to obj, such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name;
  return acc;
}, {});

export default {
  name: "ComplexTable",
  components: {Pagination},
  directives: {waves},
  filters: {
    statusFilter(status) {
      const statusMap = {
        1: "success",
        0: "info",
      };
      return statusMap[status];
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type];
    },
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      workerList: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        size: 10,
        workerId: undefined,
        jobName: undefined,
        executorHandler: undefined,
        jobStatus: undefined
      },
      routeStrategy: [
        {
          name: "ROUND_ROBIN",
          label: "轮询"
        }, {
          name: "RANDOM",
          label: "随机"
        }, {
          name: "WEIGHT_ROUND_ROBIN",
          label: "加权轮询"
        }, {
          name: "WEIGHT_RANDOM",
          label: "加权随机"
        }, {
          name: "CONSISTENT_HASH",
          label: "一致性Hash"
        }, {
          name: "BROADCAST",
          label: "广播"
        }
      ],
      executeType: [
        {
          name: "BEAN",
          label: "Bean"
        }, {
          name: "HTTP",
          label: "Http script"
        }, {
          name: "LB_HTTP",
          label: "SpringCloud http script"
        }
      ],
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      statusOptions: ["published", "draft", "deleted"],
      showReviewer: false,
      temp: {
        jobId: undefined,
        workerId: undefined, //
        jobName: "", //
        executeType: "BEAN", //
        executorHandler: "", //
        executeParam: "",
        routeStrategy: "", //
        blockStrategy: undefined,
        cron: "", //
        retryCount: 0,
        alarmEmail: "",
        nextTriggerTime: ""
      },
      dialogFormVisible: false,
      deleteJobDialog: false,
      deleteJobId: "",
      dialogStatus: "",
      textMap: {
        update: "修改",
        create: "新建",
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        workerId: [
          {required: true, message: "调度器不能为空", trigger: "blur"},
        ],
        jobName: [
          {required: true, message: "任务名称不能为空", trigger: "blur"},
        ],
        executeType: [
          {required: true, message: "执行类型不能为空", trigger: "blur"},
        ],
        routeStrategy: [
          {required: true, message: "路由策略不能为空", trigger: "blur"},
        ],
        cron: [
          {required: false, message: "Cron不能为空", trigger: "blur"},
        ],
        executorHandler: [
          {required: true, message: "Job handler不能为空", trigger: "blur"},
        ],
      },
      downloadLoading: false,
    };
  },
  created() {
    this.getWorkerList();
    this.getList();
  },
  methods: {
    getWorkerList() {
      const queryParam = {
        page: 1,
        size: 100
      };
      queryExecutor(queryParam).then(response => {
        this.workerList = response.data
      })
    },
    getList() {
      this.listLoading = true
      query(this.listQuery).then(response => {
        this.list = response.data
        // noinspection JSUnresolvedVariable
        this.total = response.total
      }).finally(() => {
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1;
      this.getList();
    },
    resetTemp() {
      this.temp = {
        jobId: undefined,
        workerId: undefined, //
        jobName: "", //
        executeType: "BEAN", //
        executorHandler: "", //
        executeParam: "",
        routeStrategy: "", //
        blockStrategy: undefined,
        cron: "", //
        retryCount: 0,
        alarmEmail: "",
        nextTriggerTime: ""
      };
    },
    resetListQuery() {
      this.listQuery = {
        page: 1,
        size: 20,
        workerId: undefined,
        jobName: undefined,
        executorHandler: undefined,
        jobStatus: undefined
      }
      this.handleFilter();
    },

    handleCreate() {
      this.resetTemp();
      this.dialogStatus = "create";
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        this.$refs["dataForm"].clearValidate();
      });
    },
    createData() {
      this.$refs["dataForm"].validate((valid) => {
        if (valid) {
          create(this.temp).then((response) => {
            this.list.unshift(response.data);
            this.dialogFormVisible = false;
            this.$notify({
              title: "成功",
              message: "创建成功",
              type: "success",
              duration: 2000,
            });
          })
        }
      });
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row); // copy obj
      this.dialogStatus = "update";
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        this.$refs["dataForm"].clearValidate();
      });
    },
    updateData() {
      this.$refs["dataForm"].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp);
          tempData.timestamp = +new Date(tempData.timestamp); // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          update(tempData).then(() => {
            // const index = this.list.findIndex((v) => v.jobId === this.temp.jobId);
            // this.list.splice(index, 1, this.temp);
            this.dialogFormVisible = false;
            this.$notify({
              title: "成功",
              message: "更新成功",
              type: "success",
              duration: 2000,
            });
            this.getList();
          });
        }
      });
    },
    handleDisable(row) {
      disable(row.jobId).then(() => {
        this.$notify({
          title: "成功",
          message: "已停用任务",
          type: "success",
          duration: 2000,
        });
        this.getList();
      });
    },
    handleTrigger(row) {
      trigger(row.jobId).then(() => {
        this.$notify({
          title: "成功",
          message: "成功触发任务",
          type: "success",
          duration: 2000,
        });
        this.getList();
      });
    },
    handleEnable(row) {
      enable(row.jobId).then(() => {
        this.$notify({
          title: "成功",
          message: "已启用任务",
          type: "success",
          duration: 2000,
        });
        this.getList();
      });
    },
    handleQueryLog(row) {
      this.$router.push({
        path: '/jobInstance',
        query: {
          jobId: row.jobId
        }
      })
    },
    handleDelete(row) {
      this.temp = Object.assign({}, row); // copy obj
      this.deleteJobDialog = true;
      this.$nextTick(() => {
        this.$refs["dataForm"].clearValidate();
      });
    },
    deleteData() {
      remove(this.deleteJobId).then(() => {
        this.$notify({
          title: "成功",
          message: "删除成功",
          type: "success",
          duration: 2000,
        });
        this.deleteJobDialog = false;
        this.deleteJobId = "";
        this.getList();
      });
    },
  },
};
</script>
