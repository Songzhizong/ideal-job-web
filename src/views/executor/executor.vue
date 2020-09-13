<template>
  <div class="app-container">
    <div class="filter-container">

      <el-input
          v-model="listQuery.title"
          placeholder="Title"
          style="width: 200px; margin-right: 2em;"
          class="filter-item"
          @keyup.enter.native="handleFilter"/>

      <el-input
          v-model="listQuery.appName"
          placeholder="App name"
          style="width: 200px; margin-right: 2em;"
          class="filter-item"
          @keyup.enter.native="handleFilter"/>
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

      <el-table-column
          label="ID"
          prop="id"
          align="center"
          width="220px">
        <template slot-scope="{row}">
          <span>{{ row.workerId }}</span>
        </template>
      </el-table-column>

      <el-table-column
          label="Title"
          prop="title"
          align="center"
          min-width="200px">
        <template slot-scope="{row}">
          <span>{{ row.title }}</span>
        </template>
      </el-table-column>

      <el-table-column
          label="App name"
          prop="appName"
          align="center"
          min-width="200px">
        <template slot-scope="{row}">
          <span>{{ row.appName }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Status" class-name="status-col" align="center" width="120px">
        <template slot-scope="{row}">
          <el-tag :type="row.online | statusFilter" v-if="row.online===false"><b>OFFLINE</b>
          </el-tag>
          <el-tag :type="row.online | statusFilter" v-if="row.online===true"><b
              style="margin-left: 4px;margin-right: 4px">ONLINE</b></el-tag>
        </template>
      </el-table-column>


      <el-table-column
          label="操作"
          align="center"
          width="230"
          class-name="small-padding fixed-width">

        <template slot-scope="{row,$index}">
          <el-button icon="el-icon-edit-outline"
                     type="primary" size="mini"
                     @click="handleUpdate(row)">编辑
          </el-button>

          <el-button icon="el-icon-delete-solid"
              size="mini"
              type="danger"
              @click="handleDelete(row)"
          >删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total>0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.size"
        @pagination="getList"
    />

    <el-dialog width="660px" :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">

      <el-form
          ref="dataForm"
          :rules="rules"
          :model="temp"
          label-position="left"
          label-width="100px"
          style="width: 500px; margin-left:50px;">
        <el-form-item label="Title" prop="title">
          <el-input v-model="temp.title"/>
        </el-form-item>
        <el-form-item label="App name" prop="appName">
          <el-input v-model="temp.appName"/>
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
  del,
} from "@/api/executor";

import waves from "@/directive/waves"; // waves directive
import Pagination from "@/components/Pagination";

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
        true: "success",
        false: "info",
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
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        size: 20,
        title: undefined,
        appName: undefined
      },
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      statusOptions: ["published", "draft", "deleted"],
      showReviewer: false,
      temp: {
        workerId: undefined,
        title: "",
        appName: ""
      },
      dialogFormVisible: false,
      dialogStatus: "",
      textMap: {
        update: "修改",
        create: "新建",
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        appName: [
          {required: true, message: "应用名称不能为空", trigger: "blur"},
        ],
        title: [
          {required: true, message: "执行器名称不能为空", trigger: "blur"},
        ],
      },
      downloadLoading: false,
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.listLoading = true
      query(this.listQuery).then(response => {
        this.list = response.data
        this.total = response.total
        this.listLoading = false
      })
    },
    handleFilter() {
      this.listQuery.page = 1;
      this.getList();
    },
    resetTemp() {
      this.temp = {
        workerId: undefined,
        title: "",
        appName: ""
      };
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
            const index = this.list.findIndex((v) => v.workerId === this.temp.workerId);
            this.list.splice(index, 1, this.temp);
            this.dialogFormVisible = false;
            this.$notify({
              title: "成功",
              message: "更新成功",
              type: "success",
              duration: 2000,
            });
          });
        }
      });
    },
    handleDelete(row) {
      del(row.workerId).then((response) => {
        this.$notify({
          title: "成功",
          message: "删除成功",
          type: "success",
          duration: 2000,
        });
        this.getList();
      });
    },
  },
};
</script>
