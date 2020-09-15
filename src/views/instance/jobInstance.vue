<!--suppress JSUnresolvedVariable -->
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
        v-model="listQuery.handleStatus"
        clearable placeholder="执行状态"
        style="width: 180px; margin-right: 1em;"
        @change="handleFilter">
        <el-option
          v-for="item in this.handleStatus"
          :key="item.name"
          :label="item.label"
          :value="item.name"/>
      </el-select>
      <el-date-picker
        v-model="timeRange"
        type="daterange"
        unlink-panels
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :picker-options="pickerOptions"
        @change="handleTimeRange"/>
      <el-button circle
                 icon="el-icon-search" class="filter-item"
                 type="primary"
                 style="margin-left: 1em"
                 @click="handleFilter"/>
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
      <el-table-column
        label="Job ID"
        prop="title"
        align="center"
        min-width="190px">
        <template slot-scope="{row}">
          <span>{{ row.jobId }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="触发类型"
        prop="title"
        align="center"
        min-width="80px">
        <template slot-scope="{row}">
          <span>{{ row.triggerType }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="调度时间"
        prop="title"
        align="center"
        min-width="160px">
        <template slot-scope="{row}">
          <span>{{ row.createdTime }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="执行时间"
        prop="title"
        align="center"
        min-width="160px">
        <template slot-scope="{row}">
          <span>{{ row.handleTime }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="执行状态"
        prop="title"
        align="center"
        min-width="140px">
        <template slot-scope="{row}">
          <el-button plain :type="parseHandleStatus(row.handleStatus).type"
                     :icon="parseHandleStatus(row.handleStatus).icon"
                     size="mini">
            <b>{{ parseHandleStatus(row.handleStatus).label }}</b></el-button>
        </template>
      </el-table-column>
      <el-table-column
        label="执行机器"
        prop="title"
        align="center"
        min-width="180px">
        <template slot-scope="{row}">
          <span>{{ row.executorInstance }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        min-width="120px"
        class-name="small-padding fixed-width">

        <template slot-scope="{row,$index}">
          <el-button icon="el-icon-edit-outline"
                     type="primary" size="mini">编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.size"
      @pagination="getList"/>
  </div>
</template>

<script>
import Pagination from "@/components/Pagination";
import {query as queryExecutor} from "@/api/executor";
import {query} from "@/api/jobInstance";
import moment from 'moment';

export default {
  name: "JobInstance",
  components: {Pagination},
  filters: {
    statusFilter(status) {
      const statusMap = {
        1: "success",
        0: "danger",
      };
      return statusMap[status];
    },
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      listQuery: {
        page: 1,
        size: 20,
        workerId: undefined,
        jobId: undefined,
        parentId: undefined,
        handleStatus: undefined,
        dispatchTimeRange: {
          start: undefined,
          end: undefined
        }
      },
      workerList: null,
      timeRange: [],
      listLoading: true,
      total: 0,
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
            picker.$emit('pick', [start, end]);
          }
        }]
      },
      handleStatus: [
        {
          name: "WAITING",
          label: "等待执行"
        }, {
          name: "RUNNING",
          label: "执行中"
        }, {
          name: "COMPLETE",
          label: "执行完成"
        }, {
          name: "ABNORMAL",
          label: "执行异常"
        }, {
          name: "DISCARD",
          label: "丢弃"
        }, {
          name: "UNKNOWN",
          label: "未知"
        },
      ]
    }
  },
  created() {
    this.getWorkerList();
    this.getList();
  },
  methods: {
    parseHandleStatus(status) {
      const statusMap = {
        '-1': {
          icon: "el-icon-warning-outline",
          type: "info",
          label: "未知"
        },
        '0': {
          icon: "el-icon-video-play",
          type: "info",
          label: "待执行"
        },
        '1': {
          icon: "el-icon-loading",
          type: "primary",
          label: "执行中"
        },
        '2': {
          icon: "el-icon-circle-check",
          type: "success",
          label: "已完成"
        },
        '3': {
          icon: "el-icon-circle-close",
          type: "warning",
          label: "异常"
        },
        '4': {
          icon: "el-icon-close",
          type: "danger",
          label: "已丢弃"
        },
      };
      return statusMap[status];
    },
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
      if (this.listQuery.handleStatus === '') {
        this.listQuery.handleStatus = undefined
      }
      this.listLoading = true;
      this.listQuery.jobId = this.$route.query.jobId
      query(this.listQuery).then(response => {
        this.list = response.data
        // noinspection JSUnresolvedVariable
        this.total = response.total
      }).finally(() => {
        this.listLoading = false
      });
    },
    handleTimeRange() {
      const start = this.timeRange[0];
      const end = this.timeRange[1];
      this.listQuery.dispatchTimeRange.start = moment(start).format('YYYY-MM-DD HH:mm:ss')
      this.listQuery.dispatchTimeRange.end = moment(end).format('YYYY-MM-DD HH:mm:ss')
      this.handleFilter()
    },
    handleFilter() {
      this.listQuery.page = 1;
      this.getList();
    },
  }
}
</script>
